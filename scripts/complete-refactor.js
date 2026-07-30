import fs from 'fs';

let code = fs.readFileSync('app.js', 'utf8');

// 1. Replace Sign In handler
code = code.replace(/await signInWithEmailAndPassword\(auth, email, password\);/g, `
const authRes = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: email, password: password })
});
localStorage.setItem('finmo_token', authRes.token);
auth.currentUser = authRes.user;
MapsTo('dashboard');
`);

// 2. Replace Sign Up handler
code = code.replace(/const userCredential = await createUserWithEmailAndPassword\(auth, email, password\);[\s\S]*?alert\("Pendaftaran berhasil! Selamat datang di finMo\."\);/g, `
const authRes = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
        email: email,
        phone: method === 'phone' ? (document.getElementById('signup-phone')?.value || '').trim() : '',
        password: password,
        name: owner,
        businessName: name
    })
});
localStorage.setItem('finmo_token', authRes.token);
auth.currentUser = authRes.user;
alert("Pendaftaran berhasil! Selamat datang di finMo.");
`);

// 3. Replace signOut(auth)
code = code.replace(/signOut\(auth\)\.then\(\(\) => \{[\s\S]*?\}\);?/g, `
localStorage.removeItem('finmo_token');
auth.currentUser = null;
location.reload();
`);

// 4. Replace onAuthStateChanged
code = code.replace(/onAuthStateChanged\(auth, \(user\) => \{[\s\S]*?\}\);/g, `
checkAuthSession().then((user) => {
    const hashPage = window.location.hash.replace('#', '');
    if (user) {
        if (hashPage === 'signin' || hashPage === 'signup' || hashPage === 'hello' || !hashPage) {
            MapsTo('dashboard', false);
        } else {
            MapsTo(hashPage, false);
        }
    } else {
        if (hashPage === 'signup') {
            MapsTo('signup', false);
        } else if (hashPage === 'hello') {
            MapsTo('hello', false);
        } else {
            MapsTo('signin', false);
        }
    }
});
`);

// 5. Replace POS load Products
code = code.replace(/const snapshot = await getDocs\(q\);[\s\S]*?snapshot\.forEach\(docSnap => \{[\s\S]*?\}\);/g, `
const prodRes = await apiFetch('/api/products');
window.posProducts = prodRes.data || [];
`);

// 6. Replace Partner save
code = code.replace(/await updateDoc\(doc\(db, 'partners', partnerId\), data\);/g, `
await apiFetch('/api/partners', { method: 'POST', body: JSON.stringify({ id: partnerId, ...data }) });
`);
code = code.replace(/await setDoc\(doc\(collection\(db, 'partners'\)\), data\);/g, `
await apiFetch('/api/partners', { method: 'POST', body: JSON.stringify(data) });
`);
code = code.replace(/await deleteDoc\(doc\(db, 'partners', id\)\);/g, `
await apiFetch('/api/partners?id=' + id, { method: 'DELETE' });
`);

// 7. Replace Product save
code = code.replace(/await updateDoc\(doc\(db, 'products', prodId\), data\);/g, `
await apiFetch('/api/products', { method: 'POST', body: JSON.stringify({ id: prodId, ...data }) });
`);
code = code.replace(/await setDoc\(doc\(collection\(db, 'products'\)\), data\);/g, `
await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(data) });
`);

// 8. Replace Raw Material save
code = code.replace(/await updateDoc\(doc\(db, 'raw_materials', rawId\), data\);/g, `
await apiFetch('/api/raw-materials', { method: 'POST', body: JSON.stringify({ id: rawId, ...data }) });
`);

// 9. Replace Category save
code = code.replace(/await addDoc\(collection\(db, 'product_categories'\), \{ uid: auth\.currentUser\.uid, nama_kategori: val \}\);/g, `
await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify({ nama: val, type: 'product_category' }) });
`);
code = code.replace(/await addDoc\(collection\(db, 'product_units'\), \{ uid: auth\.currentUser\.uid, nama_unit: val \}\);/g, `
await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify({ nama: val, type: 'product_unit' }) });
`);
code = code.replace(/await addDoc\(collection\(db, 'tx_categories'\), \{[\s\S]*?\}\);/g, `
await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify({ nama: val || 'Kategori Baru', type: 'tx_category' }) });
`);

// 10. Replace Profile save
code = code.replace(/await updateDoc\(doc\(db, 'profiles', auth\.currentUser\.uid\), data\);/g, `
await apiFetch('/api/profile', { method: 'POST', body: JSON.stringify(data) });
`);

fs.writeFileSync('app.js', code);
console.log('Complete refactor finished!');
