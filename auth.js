import { auth } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.getElementById('loginBtn').onclick = async () => {
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('password').value.trim();
  if(!email||!pass){ alert('Digite e-mail e senha'); return; }
  try{ await signInWithEmailAndPassword(auth,email,pass); window.location.href='index.html'; }
  catch(e){ alert('Erro ao entrar: '+e.message); }
};

document.getElementById('registerBtn').onclick = async () => {
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('password').value.trim();
  if(!email||!pass){ alert('Digite e-mail e senha'); return; }
  try{ await createUserWithEmailAndPassword(auth,email,pass); alert('Conta criada! Faça login.'); }
  catch(e){ alert('Erro ao criar conta: '+e.message); }
};
