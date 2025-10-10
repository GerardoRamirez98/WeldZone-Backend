// test-upload.js
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const form = new FormData();
form.append('file', fs.createReadStream('./ejemplo.pdf')); // usa un PDF de prueba en esta carpeta

const res = await fetch('http://localhost:3000/upload-specs', {
  method: 'POST',
  body: form,
});

const data = await res.json();
console.log(data);
