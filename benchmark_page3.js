import { performance } from 'perf_hooks';

class DOMElementNode {
  constructor(options) {
    this.tagName = options.tagName;
    this.isVisible = options.isVisible;
    this.parent = options.parent;
    this.xpath = options.xpath;
    this.attributes = options.attributes || {};
    this.children = options.children || [];
    this.highlightIndex = options.highlightIndex !== undefined ? options.highlightIndex : null;
  }
}

// Simulate delay that occurs due to crypto in background script environment
async function createSHA256Hash(input) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`hash_for_${input}`);
    }, 1); // simulate async delay
  });
}

function _getParentBranchPath(domElement) {
  const parents = [];
  let currentElement = domElement;
  while (currentElement?.parent !== null) {
    parents.push(currentElement);
    currentElement = currentElement.parent;
  }
  parents.reverse();
  return parents.map(parent => parent.tagName || '');
}

async function _parentBranchPathHash(parentBranchPath) {
  const parentBranchPathString = parentBranchPath.join('/');
  return createSHA256Hash(parentBranchPathString);
}

async function _attributesHash(attributes) {
  const attributesString = Object.entries(attributes)
    .map(([key, value]) => `${key}=${value}`)
    .join('');
  return createSHA256Hash(attributesString);
}

async function _xpathHash(xpath) {
  return createSHA256Hash(xpath || '');
}

function _hashString(string) {
  return string;
}

async function hashDomElement(domElement) {
  const parentBranchPath = _getParentBranchPath(domElement);
  const [branchPathHash, attributesHash, xpathHash] = await Promise.all([
    _parentBranchPathHash(parentBranchPath),
    _attributesHash(domElement.attributes),
    _xpathHash(domElement.xpath),
  ]);
  return _hashString(`${branchPathHash}-${attributesHash}-${xpathHash}`);
}

function generateTree(depth, breadth) {
  const root = new DOMElementNode({ tagName: 'root', isVisible: true, parent: null, xpath: '/' });
  let count = 0;
  function addChildren(parent, currentDepth) {
    if (currentDepth >= depth) return;
    for (let i = 0; i < breadth; i++) {
      count++;
      const child = new DOMElementNode({
        tagName: `div${count}`,
        isVisible: true,
        parent: parent,
        xpath: `${parent.xpath}/div[${i}]`,
        attributes: { class: `class${count}`, id: `id${count}` },
        highlightIndex: count % 3 === 0 ? count : null
      });
      parent.children.push(child);
      addChildren(child, currentDepth + 1);
    }
  }
  addChildren(root, 0);
  return root;
}

function getClickableElements(domElement) {
  const clickableElements = [];
  for (const child of domElement.children) {
    if (child instanceof DOMElementNode) {
      if (child.highlightIndex !== null) {
        clickableElements.push(child);
      }
      clickableElements.push(...getClickableElements(child));
    }
  }
  return clickableElements;
}

async function runBenchmark() {
  const root = generateTree(6, 4); // 4^6 = ~4000 nodes
  const clickableElements = getClickableElements(root);
  console.log(`Generated tree with ${clickableElements.length} clickable elements.`);

  const oldHashes = new Set();
  for (let i = 0; i < clickableElements.length / 2; i++) {
    oldHashes.add(`fake_hash_${i}`);
  }

  // Sequential
  const startSeq = performance.now();
  for (const domElement of clickableElements) {
    const hash = await hashDomElement(domElement);
    domElement.isNew = !oldHashes.has(hash);
  }
  const endSeq = performance.now();
  const seqTime = (endSeq - startSeq);
  console.log(`Sequential took: ${seqTime.toFixed(2)} ms`);

  // Batched (Batch size 50)
  const startBatched = performance.now();
  const BATCH_SIZE = 50;
  for (let i = 0; i < clickableElements.length; i += BATCH_SIZE) {
    const batch = clickableElements.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (domElement) => {
      const hash = await hashDomElement(domElement);
      domElement.isNew = !oldHashes.has(hash);
    }));
  }
  const endBatched = performance.now();
  const batchedTime = (endBatched - startBatched);
  console.log(`Batched (50) took: ${batchedTime.toFixed(2)} ms`);
  console.log(`Improvement over Seq: ${((seqTime - batchedTime) / seqTime * 100).toFixed(2)}%`);

  // Parallel (All at once)
  const startPar = performance.now();
  await Promise.all(clickableElements.map(async (domElement) => {
    const hash = await hashDomElement(domElement);
    domElement.isNew = !oldHashes.has(hash);
  }));
  const endPar = performance.now();
  const parTime = (endPar - startPar);
  console.log(`Parallel (All) took: ${parTime.toFixed(2)} ms`);
}

runBenchmark();
