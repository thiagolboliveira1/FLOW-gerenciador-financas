import { db, auth } from './firebase.js';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Salvar item (criar/editar)
export async function salvarItem(item) {
  const uid = auth.currentUser.uid;
  const ref = doc(db, `usuarios/${uid}/financas/${item.id}`);
  await setDoc(ref, item, { merge: true });
}

// Deletar item
export async function deletarItem(id) {
  const uid = auth.currentUser.uid;
  const ref = doc(db, `usuarios/${uid}/financas/${id}`);
  await deleteDoc(ref);
}

// Carregar finanças do usuário logado
export async function carregarFinancas() {
  const uid = auth.currentUser.uid;
  const ref = collection(db, `usuarios/${uid}/financas`);
  const snap = await getDocs(ref);
  return snap.docs.map(doc => doc.data());
}
