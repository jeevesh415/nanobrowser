// Mock chrome.storage
const store = new Map();
globalThis.chrome = {
  storage: {
    local: {
      get: async (keys) => {
        await new Promise((r) => setTimeout(r, 10)); // Simulate async I/O 10ms delay
        const key = keys[0];
        return { [key]: store.get(key) };
      },
      set: async (items) => {
        await new Promise((r) => setTimeout(r, 10)); // Simulate async I/O 10ms delay
        for (const [key, value] of Object.entries(items)) {
          store.set(key, value);
        }
      },
      onChanged: {
        addListener: () => {},
      },
    },
  },
};

const runBenchmark = async () => {
  const { chatHistoryStore } = await import('./dist-benchmark/index.js');

  // Set up 100 sessions
  console.log('Setting up 100 mock sessions...');
  for (let i = 0; i < 100; i++) {
    await chatHistoryStore.createSession(`Session ${i}`);
  }

  const sessions = await chatHistoryStore.getSessionsMetadata();
  console.log(`Created ${sessions.length} sessions`);

  // Measure clearAllSessions time
  console.log('Measuring clearAllSessions...');
  const start = performance.now();
  await chatHistoryStore.clearAllSessions();
  const end = performance.now();

  console.log(`clearAllSessions took ${(end - start).toFixed(2)}ms`);

  const afterClear = await chatHistoryStore.getSessionsMetadata();
  console.log(`Sessions after clear: ${afterClear.length}`);
};

runBenchmark().catch(console.error);
