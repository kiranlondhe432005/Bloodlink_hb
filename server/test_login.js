const API =
  process.env.NODE_ENV === 'production'
    ? 'https://bloodlink-hb.onrender.com'
    : 'http://localhost:5000';

async function testLogin() {
  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'pk@gmail.com',
        password: 'password'
      })
    });

    const data = await res.json();
    console.log('Login Status:', res.status, data);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testLogin();