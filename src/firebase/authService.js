import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
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

/**
 * Registers a new user within Firebase Authentication and provisions
 * a corresponding document within the Cloud Firestore users collection.
 */
export const registerUser = async (email, password, profileData) => {
  const normalizedEmail = email.trim().toLowerCase();
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail,
    password,
  );
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    email: normalizedEmail,
    timezone: profileData.timezone || "not-set",
    fyStart: profileData.fyStart || "not-set",
    fyEnd: profileData.fyEnd || "not-set",

    nativeCountry:
      profileData.nativeCountry || profileData.homeCountry || "not-set",
    homeCountry: profileData.homeCountry || "not-set",
    residencyThreshold: profileData.residencyThreshold || 183,
    residencyPeriodStart:
      profileData.residencyPeriodStart || profileData.fyStart || "not-set",
    residencyPeriodEnd:
      profileData.residencyPeriodEnd || profileData.fyEnd || "not-set",

    createdAt: new Date().toISOString(),
  });

  return user;
};

/**
 * Logs in a user using Email/Password.
 * On success, it returns the user cleanly to redirect to the dashboard.
 */
export const loginUser = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  // Check email exists first
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", normalizedEmail));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    const error = new Error(
      "No account found with this email address. Please register first.",
    );
    error.code = "auth/user-not-found";
    throw error;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password,
    );

    // SUCCESS PATH: Return the user object directly.
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

    // Handles Firebase too many failed login attempts
    if (error?.code === "auth/too-many-requests") {
      const friendlyError = new Error(
        "Too many failed login attempts. Please try again later.",
      );
      friendlyError.code = "auth/too-many-requests";
      friendlyError.userMessage =
        "Too many failed login attempts. Please try again later.";
      throw friendlyError;
    }

    // Handles account not registered
    if (error?.code === "auth/user-not-found") {
      const friendlyError = new Error(
        "No account found with this email address. Please register first.",
      );
      friendlyError.code = "auth/user-not-found";
      friendlyError.userMessage =
        "No account found with this email address. Please register first.";
      throw friendlyError;
    }

    // Handles incorrect password variants
    if (
      error?.code === "auth/wrong-password" ||
      error?.code === "auth/invalid-password" ||
      error?.code === "auth/invalid-login-credentials" ||
      error?.code === "auth/invalid-credential"
    ) {
      const friendlyError = new Error("Incorrect password. Please try again.");
      friendlyError.code = "auth/wrong-password";
      friendlyError.userMessage = "Incorrect password. Please try again.";
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
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
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
export const checkEmailExists = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", normalizedEmail));

  const querySnapshot = await getDocs(q);

  return !querySnapshot.empty;
};
