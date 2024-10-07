// import { LambdaLoggerFactory } from "./lambda/logger";
// import { ICapabilitiesFactory } from "./capabilities";

// export class CapabilitiesFactory implements ICapabilitiesFactory {
//   get<T>(capability: string): T {
//     switch (capability) {
//       case "logger":
//         return LambdaLoggerFactory.create() as T;
//       // Add cases for other capabilities here
//       default:
//         throw new Error(`Unsupported capability: ${capability}`);
//     }
//   }
// }
