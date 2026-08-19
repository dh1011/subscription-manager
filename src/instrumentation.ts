export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeServer } = await import('./instrumentation-node');
    await initializeServer();
  }
}
