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

//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           try {
//             const { latitude, longitude } = position.coords;

//             const response = await fetch(
//               `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
//             );

//             const data = await response.json();

//             const currentCountryCode =
//               data?.address?.country_code?.toUpperCase();

//             if (!currentCountryCode) {
//               resolve(false);
//               return;
//             }

//             const latestRecord = records.length > 0 ? records[0] : null;
//             const today = new Date().toISOString().split("T")[0];

//             const todayRecordExists = records.some((r) => {
//               const arrival = r.arrivalDate?.split("T")[0] || r.arrivalDate;

//               return arrival === today && r.toCountry === currentCountryCode;
//             });

//             const countryChanged =
//               latestRecord && latestRecord.toCountry !== currentCountryCode;

//             if (todayRecordExists && !countryChanged) {
//               resolve(false);
//               return;
//             }

//             await addTravelRecord(user.uid, {
//               fromCountry: latestRecord
//                 ? latestRecord.toCountry
//                 : currentCountryCode,
//               toCountry: currentCountryCode,
//               departureDate: today,
//               arrivalDate: today,
//               purpose: countryChanged
//                 ? "Country Changed"
//                 : "Daily GPS Check-In",
//               latitude,
//               longitude,
//             });

//             resolve(true);
//           } catch (err) {
//             reject(err);
//           }
//         },
//         (err) => reject(err),
//         {
//           enableHighAccuracy: true,
//           timeout: 15000,
//         },
//       );
//     } catch (err) {
//       reject(err);
//     }
//   });
// };




import { addTravelRecord } from "../firebase/firestoreService";

export const autoTrackLocation = (
  user,
  records,
  setCurrentCountry = () => {},
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!navigator.geolocation) {
        reject("No geolocation");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
            );

            const data = await response.json();

            const currentCountryCode =
              data?.address?.country_code?.toUpperCase();

            if (!currentCountryCode) {
              resolve(false);
              return;
            }

            const latestRecord = records.length > 0 ? records[0] : null;
            const today = new Date().toISOString().split("T")[0];

            const todayRecordExists = records.some((r) => {
              const arrival = r.arrivalDate?.split("T")[0] || r.arrivalDate;
              return arrival === today && r.toCountry === currentCountryCode;
            });

            const countryChanged =
              latestRecord && latestRecord.toCountry !== currentCountryCode;

            if (todayRecordExists && !countryChanged) {
              resolve(false);
              return;
            }

            await addTravelRecord(user.uid, {
              fromCountry: latestRecord
                ? latestRecord.toCountry
                : currentCountryCode,
              toCountry: currentCountryCode,
              departureDate: today,
              arrivalDate: today,
              purpose: countryChanged
                ? "Country Changed"
                : "Daily GPS Check-In",
              latitude,
              longitude,
            });

            resolve(true);
          } catch (err) {
            reject(err);
          }
        },
        (err) => reject(err),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 86400000, // Reuses calculated coordinates within 24 hours to reduce permissions prompts
        },
      );
    } catch (err) {
      reject(err);
    }
  });
};