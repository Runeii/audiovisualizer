// In a global.d.ts or a specific declaration file
declare global {
  interface Window {
    debug: string;
  }
}

// This ensures the type definition is global and available in all files
export { };
