import { performance } from 'perf_hooks';

// Simulate a DOM Element Node
interface DOMElementNode {
  tagName: string;
  attributes: Record<string, string>;
  isNew?: boolean;
}

// Simulate the hash function (e.g. some crypto or text processing)
const mockHashDomElement = async (el: DOMElementNode): Promise<string> => {
  // Simulate some async work taking 1ms
  await new Promise((resolve) => setTimeout(resolve, 1));
  return `${el.tagName}-${Object.keys(el.attributes).length}`;
};

// Generate 1000 mock elements
const elements: DOMElementNode[] = Array.from({ length: 1000 }, (_, i) => ({
  tagName: `div`,
  attributes: { id: `el-${i}` },
}));

// Mock previous hashes
const cachedHashes = new Set(['div-1']);

async function runSequential() {
  const start = performance.now();
  for (const domElement of elements) {
    const hash = await mockHashDomElement(domElement);
    domElement.isNew = !cachedHashes.has(hash);
  }
  const end = performance.now();
  console.log(`Sequential execution took: ${(end - start).toFixed(2)}ms`);
}

async function runBatchedParallel() {
  const start = performance.now();

  const batchSize = 50;
  for (let i = 0; i < elements.length; i += batchSize) {
    const batch = elements.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (domElement) => {
        const hash = await mockHashDomElement(domElement);
        domElement.isNew = !cachedHashes.has(hash);
      })
    );
  }

  const end = performance.now();
  console.log(`Batched parallel (size 50) took: ${(end - start).toFixed(2)}ms`);
}

async function run() {
  console.log('Running benchmark for 1000 elements (1ms per hash)...');
  await runSequential();
  await runBatchedParallel();
}

run().catch(console.error);
