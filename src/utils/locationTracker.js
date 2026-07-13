import { addTravelRecord } from "../firebase/firestoreService";

export const autoTrackLocation = (
  user,
  records,
  profile = null, // Added profile param to explicitly track background updates
  setCurrentCountry = () => {},
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!navigator.geolocation) {
        reject("No geolocation");
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      
      // Global atomic lock to block concurrent snapshot evaluations before Firestore updates
      if (window.isLocationTrackingActive === today) {
        resolve(false);
        return;
      }

      // Set the lock synchronously IMMEDIATELY here to prevent parallel execution during the geolocation delay
      window.isLocationTrackingActive = today;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
            );

            const data = await response.json();
            const currentCountryCode = data?.address?.country_code?.toUpperCase();

            if (!currentCountryCode) {
              window.isLocationTrackingActive = null;
              resolve(false);
              return;
            }

            // Dynamically find the absolute latest record by date to avoid sorting array bugs
            const latestRecord = records.length > 0 
              ? [...records].sort((a, b) => new Date(b.arrivalDate || b.departureDate) - new Date(a.arrivalDate || a.departureDate))[0]
              : null;

            const todayGpsRecordExists = records.some((r) => {
              const arrival = r.arrivalDate?.split("T")[0] || r.arrivalDate;
              const departure = r.departureDate?.split("T")[0] || r.departureDate;
              return (
                arrival === today &&
                departure === today &&
                (r.purpose === "Daily GPS Check-In" || r.purpose === "Country Changed")
              );
            });

            if (todayGpsRecordExists) {
              resolve(false);
              return;
            }

            // FIX: Determine baseline origin country dynamically, ensuring it scales with profile alterations
            const activeProfileHome = (profile?.homeCountry || profile?.nativeCountry || currentCountryCode).toUpperCase();
            let calculatedFromCountry = latestRecord ? latestRecord.toCountry : currentCountryCode;
            
            if (latestRecord && latestRecord.purpose === "Initial Home Stay") {
              calculatedFromCountry = activeProfileHome;
            }

            const countryChanged = latestRecord && calculatedFromCountry !== currentCountryCode;

            await addTravelRecord(user.uid, {
              fromCountry: calculatedFromCountry,
              toCountry: currentCountryCode,
              departureDate: today,
              arrivalDate: today,
              purpose: countryChanged ? "Country Changed" : "Daily GPS Check-In",
              latitude,
              longitude,
            });

            resolve(true);
          } catch (err) {
            window.isLocationTrackingActive = null;
            reject(err);
          }
        },
        (err) => {
          window.isLocationTrackingActive = null;
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 86400000,
        },
      );
    } catch (err) {
      window.isLocationTrackingActive = null;
      reject(err);
    }
  });
};







// import { addTravelRecord } from "../firebase/firestoreService";

// export const autoTrackLocation = (
//   user,
//   records,
//   setCurrentCountry = () => {},
// ) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       if (!navigator.geolocation) {
//         reject("No geolocation");
//         return;
//       }

//       const today = new Date().toISOString().split("T")[0];
      
//       // Global atomic lock to block concurrent snapshot evaluations before Firestore updates
//       if (window.isLocationTrackingActive === today) {
//         resolve(false);
//         return;
//       }

//       // Set the lock synchronously IMMEDIATELY here to prevent parallel execution during the geolocation delay
//       window.isLocationTrackingActive = today;

//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           try {
//             const { latitude, longitude } = position.coords;

//             const response = await fetch(
//               `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
//             );

//             const data = await response.json();
//             const currentCountryCode = data?.address?.country_code?.toUpperCase();

//             if (!currentCountryCode) {
//               window.isLocationTrackingActive = null;
//               resolve(false);
//               return;
//             }

//             // Dynamically find the absolute latest record by date to avoid sorting array bugs
//             const latestRecord = records.length > 0 
//               ? [...records].sort((a, b) => new Date(b.arrivalDate || b.departureDate) - new Date(a.arrivalDate || a.departureDate))[0]
//               : null;

//             const todayGpsRecordExists = records.some((r) => {
//               const arrival = r.arrivalDate?.split("T")[0] || r.arrivalDate;
//               const departure = r.departureDate?.split("T")[0] || r.departureDate;
//               return (
//                 arrival === today &&
//                 departure === today &&
//                 (r.purpose === "Daily GPS Check-In" || r.purpose === "Country Changed")
//               );
//             });

//             if (todayGpsRecordExists) {
//               resolve(false);
//               return;
//             }

//             const countryChanged = latestRecord && latestRecord.toCountry !== currentCountryCode;

//             await addTravelRecord(user.uid, {
//               fromCountry: latestRecord ? latestRecord.toCountry : currentCountryCode,
//               toCountry: currentCountryCode,
//               departureDate: today,
//               arrivalDate: today,
//               purpose: countryChanged ? "Country Changed" : "Daily GPS Check-In",
//               latitude,
//               longitude,
//             });

//             resolve(true);
//           } catch (err) {
//             window.isLocationTrackingActive = null;
//             reject(err);
//           }
//         },
//         (err) => {
//           window.isLocationTrackingActive = null;
//           reject(err);
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 15000,
//           maximumAge: 86400000,
//         },
//       );
//     } catch (err) {
//       window.isLocationTrackingActive = null;
//       reject(err);
//     }
//   });
// };



// // import { addTravelRecord } from "../firebase/firestoreService";

// // export const autoTrackLocation = (
// //   user,
// //   records,
// //   setCurrentCountry = () => {},
// // ) => {
// //   return new Promise(async (resolve, reject) => {
// //     try {
// //       if (!navigator.geolocation) {
// //         reject("No geolocation");
// //         return;
// //       }

// //       const today = new Date().toISOString().split("T")[0];
      
// //       // Global atomic lock to block concurrent snapshot evaluations before Firestore updates
// //       if (window.isLocationTrackingActive === today) {
// //         resolve(false);
// //         return;
// //       }

// //       // FIX: Set the lock synchronously IMMEDIATELY here to prevent parallel 
// //       // component re-renders from bypassing the check during the geolocation delay.
// //       window.isLocationTrackingActive = today;

// //       navigator.geolocation.getCurrentPosition(
// //         async (position) => {
// //           try {
// //             const { latitude, longitude } = position.coords;

// //             const response = await fetch(
// //               `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
// //             );

// //             const data = await response.json();
// //             const currentCountryCode = data?.address?.country_code?.toUpperCase();

// //             if (!currentCountryCode) {
// //               // Reset the lock if the network lookup fails completely
// //               window.isLocationTrackingActive = null;
// //               resolve(false);
// //               return;
// //             }

// //             const latestRecord = records.length > 0 ? records[0] : null;

// //             const todayGpsRecordExists = records.some((r) => {
// //               const arrival = r.arrivalDate?.split("T")[0] || r.arrivalDate;
// //               const departure = r.departureDate?.split("T")[0] || r.departureDate;
// //               return (
// //                 arrival === today &&
// //                 departure === today &&
// //                 (r.purpose === "Daily GPS Check-In" || r.purpose === "Country Changed")
// //               );
// //             });

// //             if (todayGpsRecordExists) {
// //               resolve(false);
// //               return;
// //             }

// //             const countryChanged = latestRecord && latestRecord.toCountry !== currentCountryCode;

// //             await addTravelRecord(user.uid, {
// //               fromCountry: latestRecord ? latestRecord.toCountry : currentCountryCode,
// //               toCountry: currentCountryCode,
// //               departureDate: today,
// //               arrivalDate: today,
// //               purpose: countryChanged ? "Country Changed" : "Daily GPS Check-In",
// //               latitude,
// //               longitude,
// //             });

// //             resolve(true);
// //           } catch (err) {
// //             // Clear the lock on inner failures so the application can attempt to track again if refreshed
// //             window.isLocationTrackingActive = null;
// //             reject(err);
// //           }
// //         },
// //         (err) => {
// //           // Clear the lock on geolocation permission or hardware errors
// //           window.isLocationTrackingActive = null;
// //           reject(err);
// //         },
// //         {
// //           enableHighAccuracy: true,
// //           timeout: 15000,
// //           maximumAge: 86400000,
// //         },
// //       );
// //     } catch (err) {
// //       window.isLocationTrackingActive = null;
// //       reject(err);
// //     }
// //   });
// // };




// // // import { addTravelRecord } from "../firebase/firestoreService";

// // // export const autoTrackLocation = (
// // //   user,
// // //   records,
// // //   setCurrentCountry = () => {},
// // // ) => {
// // //   return new Promise(async (resolve, reject) => {
// // //     try {
// // //       if (!navigator.geolocation) {
// // //         reject("No geolocation");
// // //         return;
// // //       }

// // //       navigator.geolocation.getCurrentPosition(
// // //         async (position) => {
// // //           try {
// // //             const { latitude, longitude } = position.coords;

// // //             const response = await fetch(
// // //               `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
// // //             );

// // //             const data = await response.json();

// // //             const currentCountryCode =
// // //               data?.address?.country_code?.toUpperCase();

// // //             if (!currentCountryCode) {
// // //               resolve(false);
// // //               return;
// // //             }

// // //             const latestRecord = records.length > 0 ? records[0] : null;
// // //             const today = new Date().toISOString().split("T")[0];

// // //             // Check if today's GPS record already exists - prevents duplicate auto-tracking
// // //             const todayGpsRecordExists = records.some((r) => {
// // //               const arrival = r.arrivalDate?.split("T")[0] || r.arrivalDate;
// // //               const departure =
// // //                 r.departureDate?.split("T")[0] || r.departureDate;
// // //               return (
// // //                 arrival === today &&
// // //                 departure === today &&
// // //                 (r.purpose === "Daily GPS Check-In" ||
// // //                   r.purpose === "Country Changed")
// // //               );
// // //             });

// // //             const countryChanged =
// // //               latestRecord && latestRecord.toCountry !== currentCountryCode;

// // //             // If GPS record for today already exists, don't create another
// // //             if (todayGpsRecordExists) {
// // //               resolve(false);
// // //               return;
// // //             }

// // //             await addTravelRecord(user.uid, {
// // //               fromCountry: latestRecord
// // //                 ? latestRecord.toCountry
// // //                 : currentCountryCode,
// // //               toCountry: currentCountryCode,
// // //               departureDate: today,
// // //               arrivalDate: today,
// // //               purpose: countryChanged
// // //                 ? "Country Changed"
// // //                 : "Daily GPS Check-In",
// // //               latitude,
// // //               longitude,
// // //             });

// // //             resolve(true);
// // //           } catch (err) {
// // //             reject(err);
// // //           }
// // //         },
// // //         (err) => reject(err),
// // //         {
// // //           enableHighAccuracy: true,
// // //           timeout: 15000,
// // //           maximumAge: 86400000, // Reuses calculated coordinates within 24 hours to reduce permissions prompts
// // //         },
// // //       );
// // //     } catch (err) {
// // //       reject(err);
// // //     }
// // //   });
// // // };
