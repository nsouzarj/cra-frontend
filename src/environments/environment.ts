// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// For development, use the machine's IP address to allow mobile access
// Replace '192.168.1.103' with your actual machine's IP address
export const environment = {
  production: false,
  apiUrl: 'https://cra-backend-nnb0.onrender.com/cra-api'  // Updated to your machine's correct IP address
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.