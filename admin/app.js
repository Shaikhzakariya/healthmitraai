import React, { useEffect, useState } from "react";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAVL3l38f5njbfvhbLdZHvEEwLtOkNE9kE",
  authDomain: "diabetes-mitra-de5f8.firebaseapp.com",
  projectId: "diabetes-mitra-de5f8",
  storageBucket: "diabetes-mitra-de5f8.firebasestorage.app",
  messagingSenderId: "916099811993",
  appId: "1:916099811993:web:9ae0d4f89d8ce01ffd8608",
  measurementId: "G-JD0D5KTWKX",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [subData, setSubData] = useState({
    foodEntries: [],
    chats: [],
    goals: [],
    imageAnalysisHistory: [],
  });

  const ADMIN_EMAIL = "admin@example.com"; // change to your admin email

  // ----------------------- AUTH -----------------------
  const login = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      if (userCred.user.email === ADMIN_EMAIL) {
        setAdmin(userCred.user);
        setError("");
      } else {
        setError("You are not authorized as admin.");
        await signOut(auth);
      }
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  const logout = async () => {
    await signOut(auth);
    setAdmin(null);
    setSelectedUser(null);
  };

  // ----------------------- LOAD USERS -----------------------
  const loadUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setUsers(list);
  };

  // ----------------------- LOAD SUBCOLLECTIONS -----------------------
  const loadSubcollections = async (uid) => {
  const subNames = ["foodEntries", "chats", "goals", "imageAnalysisHistory"];
  const result = {};

  for (let name of subNames) {
    const colRef = collection(db, `users/${uid}/${name}`);
    const snap = await getDocs(colRef);

    if (name === "chats") {
      const chatsData = [];
      for (let chatDoc of snap.docs) {
        const chatId = chatDoc.id;
        const chatData = { id: chatId, ...chatDoc.data() };

        // fetch all messages in the subcollection
        const messagesRef = collection(
          db,
          `users/${uid}/chats/${chatId}/messages`
        );
        const msgSnap = await getDocs(messagesRef);

        if (!msgSnap.empty) {
          // Find the first message document that has a 'text' property
          const messageDocWithContent = msgSnap.docs.find(doc => doc.data().text);

          if (messageDocWithContent) {
            chatData.firstMessage = { id: messageDocWithContent.id, ...messageDocWithContent.data() };
          }
        }

        chatsData.push(chatData);
      }
      result[name] = chatsData;
    } else {
      result[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  }

  setSubData(result);
};



  useEffect(() => {
    if (admin) loadUsers();
  }, [admin]);

  const selectUser = async (user) => {
    setSelectedUser(user);
    await loadSubcollections(user.id);
  };

  // ----------------------- LOGIN PAGE -----------------------
  if (!admin)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans">
        <div className="bg-slate-800 p-8 rounded-lg shadow-2xl w-full max-w-sm border border-slate-700">
          <h2 className="text-3xl font-bold mb-6 text-center text-white">Admin Login</h2>
          <div className="space-y-4">
            <input
              className="w-full p-3 bg-slate-700 text-white border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-full p-3 bg-slate-700 text-white border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
              type="password"
              onChange={(e) => setPass(e.target.value)}
            />
          </div>
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
          <button
            onClick={login}
            className="bg-blue-600 text-white w-full py-3 mt-6 rounded-md hover:bg-blue-700 transition-colors duration-300 font-bold"
          >
            Login
          </button>
        </div>
      </div>
    );

  // ----------------------- USER LIST PAGE -----------------------
  if (!selectedUser)
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <button
              onClick={logout}
              className="bg-slate-800 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-md transition-colors duration-300"
            >
              Logout
            </button>
          </header>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-400">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-400">Total Users</h3>
                  <p className="text-3xl font-bold mt-1">{users.length}</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-400">Users with Food Entries</h3>
                  <p className="text-3xl font-bold mt-1">{users.filter((u) => u.foodEntriesCount > 0).length}</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-400">Users with Goals</h3>
                  <p className="text-3xl font-bold mt-1">{users.filter((u) => u.goalsCount > 0).length}</p>
              </div>
            </div>
          </section>

          <section className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User ID</th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u.id} className={`border-t border-slate-700 hover:bg-slate-700/50 transition-colors ${index === users.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="p-3 text-sm text-slate-400 font-mono">{u.id}</td>
                    <td className="p-3 text-sm">{u.name || <span className="text-slate-500 italic">Unnamed</span>}</td>
                    <td className="p-3 text-sm">{u.email}</td>
                    <td className="p-3">
                      <button
                        onClick={() => selectUser(u)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    );

  // ----------------------- SELECTED USER DETAIL PAGE -----------------------
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans">
        <div className="max-w-5xl mx-auto">
      <button
        onClick={() => setSelectedUser(null)}
        className="mb-6 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
      >
        ← Back to Dashboard
      </button>

      <header className="mb-8">
        <h2 className="text-3xl font-bold">
          {selectedUser.name || "Unnamed"}
        </h2>
        <p className="text-slate-400">{selectedUser.email}</p>
      </header>

      <div className="space-y-8">
      {["foodEntries", "chats", "goals", "imageAnalysisHistory"].map(
        (section) => (
          <section key={section} className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-xl font-semibold mb-4 capitalize">{section.replace(/([A-Z])/g, ' $1')}</h3>

            {subData[section]?.length === 0 ? (
              <p className="text-slate-500 italic">No entries for this section.</p>
            ) : section === "chats" ? (
              <div className="space-y-4">
              {subData.chats.map((chat) => (
                <div key={chat.id} className="bg-slate-700/50 p-4 rounded-md">
                  <p className="font-semibold">Chat ID: <span className="font-mono text-sm text-slate-400">{chat.id}</span></p>
                  <p>Title: {chat.title || "N/A"}</p>

                  {chat.firstMessage ? (
                    <div className="mt-3 border-t border-slate-600 pt-3">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div><strong className="text-slate-400 block text-xs">Message ID</strong> <span className="font-mono">{chat.firstMessage.id}</span></div>
                        <div><strong className="text-slate-400 block text-xs">Sender</strong> {chat.firstMessage.sender || "N/A"}</div>
                        <div className="col-span-2"><strong className="text-slate-400 block text-xs">Timestamp</strong> {chat.firstMessage.timestamp ? new Date(chat.firstMessage.timestamp.seconds * 1000).toLocaleString() : "N/A"}</div>
                        <div className="col-span-4 mt-2"><strong className="text-slate-400 block text-xs">Content</strong> <p className="mt-1 whitespace-pre-wrap">{chat.firstMessage.text || "N/A"}</p></div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic mt-2">No messages in this chat.</p>
                  )}
                </div>
              ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left">
                    <tr className="border-b border-slate-700">
                      <th className="p-2 font-semibold">ID</th>
                      <th className="p-2 font-semibold">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subData[section].map((d) => (
                      <tr key={d.id} className="border-b border-slate-700 last:border-0">
                        <td className="p-2 align-top font-mono text-slate-400">{d.id}</td>
                        <td className="p-2">
                          <pre className="whitespace-pre-wrap text-xs bg-slate-900 p-3 rounded-md">
                            {JSON.stringify(d, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      )}
      </div>
      </div>
    </div>
  );
}

