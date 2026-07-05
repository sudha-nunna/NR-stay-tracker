import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

/**
 * Registers a new user within Firebase Authentication and provisions
 * a corresponding document within the Cloud Firestore users collection.
 */
export const registerUser = async (email, password, profileData) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    timezone: profileData.timezone || "America/New_York",
    fyStart: profileData.fyStart || "2026-01-01",
    fyEnd: profileData.fyEnd || "2026-12-31",

    nativeCountry: profileData.nativeCountry || profileData.homeCountry || "",
    homeCountry: profileData.homeCountry || "US",
    residencyThreshold: profileData.residencyThreshold || 183,
    residencyPeriodStart:
      profileData.residencyPeriodStart || profileData.fyStart || "2026-01-01",
    residencyPeriodEnd:
      profileData.residencyPeriodEnd || profileData.fyEnd || "2026-12-31",

    createdAt: new Date().toISOString(),
  });

  return user;
};

/**
 * Logs in a user using Email/Password.
 * On success, it returns the user cleanly to redirect to the dashboard.
 */
export const loginUser = async (email, password) => {
  const normalizedEmail = email.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password,
    );

    // SUCCESS PATH: Return the user object directly. 
    // This bypasses the catch block completely so valid logins bypass error processing.
    return userCredential.user;
  } catch (error) {
    console.error("[authService.loginUser] Firebase auth error", {
      code: error?.code,
      message: error?.message,
      email: normalizedEmail,
    });

    // Check for explicit formatting errors first
    if (error?.code === "auth/invalid-email") {
      const friendlyError = new Error("Please enter a valid email address.");
      friendlyError.code = "auth/invalid-email";
      friendlyError.userMessage = "Please enter a valid email address.";
      throw friendlyError;
    }

    // Handles Firebase invalid credentials along with historical variants
    if (
      error?.code === "auth/wrong-password" ||
      error?.code === "auth/invalid-password" ||
      error?.code === "auth/invalid-login-credentials" ||
      error?.code === "auth/invalid-credential" ||
      error?.code === "auth/user-not-found"
    ) {
      let signInMethods = [];

      try {
        signInMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
      } catch (methodError) {
        console.error(
          "[authService.loginUser] Failed to fetch sign-in methods",
          {
            code: methodError?.code,
            message: methodError?.message,
            email: normalizedEmail,
          },
        );
      }

      // Check for Google-only authentication account restriction setup
      if (
        signInMethods.includes("google.com") &&
        !signInMethods.includes("password")
      ) {
        const friendlyError = new Error(
          "This account uses Google Sign-In. Please sign in with Google or create a password using Forgot Password.",
        );
        friendlyError.code = "auth/google-only-account";
        friendlyError.userMessage =
          "This account uses Google Sign-In. Please sign in with Google or create a password using Forgot Password.";
        throw friendlyError;
      }

      // Fallback for general incorrect entries
      const friendlyError = new Error("Invalid email address or password.");
      friendlyError.code = "auth/invalid-login";
      friendlyError.userMessage = "Invalid email address or password.";
      throw friendlyError;
    }

    // Unhandled generic fallback failures
    const friendlyError = new Error(
      error?.userMessage || "Unable to sign in. Please try again.",
    );
    friendlyError.code = error?.code || "auth/login-failed";
    friendlyError.userMessage =
      error?.userMessage || "Unable to sign in. Please try again.";
    throw friendlyError;
  }
};

export const logoutUser = async () => {
  return await signOut(auth);
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email.trim());
};

export const getUserProfile = async (uid) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }

  const authUser = auth.currentUser;
  if (authUser && authUser.email) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", authUser.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
  }
  throw new Error("User profile data structure could not be resolved.");
};

/**
 * Authenticates a user via Google Sign-In with an automatic cross-linking engine.
 */
export const loginWithGoogle = async () => {
  let user;
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    user = userCredential.user;
  } catch (error) {
    if (error.code === "auth/account-exists-with-different-credential") {
      const result = await signInWithPopup(auth, googleProvider);
      user = result.user;
    } else {
      throw error;
    }
  }

  const docRef = doc(db, "users", user.uid);
  let docSnap = await getDoc(docRef);
  let accountExists = docSnap.exists();

  if (!accountExists && user.email) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", user.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      accountExists = true;
    }
  }

  if (!accountExists) {
    await signOut(auth);
    throw new Error(
      "No tracking account found. Please register your profile first before signing in.",
    );
  }

  return user;
};