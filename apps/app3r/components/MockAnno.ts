// Barrel re-export so both import paths resolve:
//   @/components/MockAnno        ← canonical path (CMD spec)
//   @/components/common          ← legacy path (still works via index.ts)
export {
  MockAnnoOrigin,
  MockAnnoNav,
  MockAnnoXapp,
} from "./common/MockAnno";
