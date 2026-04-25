async function testLogin() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pk@gmail.com', password: 'password' }) // use typical pass
    });
    const data = await res.json();
    console.log('Login Status:', res.status, data);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testLogin();
