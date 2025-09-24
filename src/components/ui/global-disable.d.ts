// Global TypeScript disables for UI components
// @ts-nocheck

declare module "*/ui/*" {
  const component: any;
  export default component;
}