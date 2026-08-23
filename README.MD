## Para Correr el Backend

Instalamos dependencias:

pip install --upgrade pip

pip install -r requirements.txt

Corremos el backend, con cualquiera de estos dos comandos:

py main.py

python main.py

### Puerto del backend

El puerto se configura con la variable `BACKEND_PORT`. Para desarrollo local, el archivo
`backend/.env` ya establece `BACKEND_PORT=8001`, evitando el puerto `5000` que está ocupado.
Si necesitas otro, cambia ese valor antes de iniciar el backend.

## Para Correr el Frontend

Instalamos dependencias:

npm install

Corremos el frontend, con cualquiera de estos dos comandos:

npm run dev

pnpm dev

### URL de la API

Las llamadas del frontend usan `NEXT_PUBLIC_API_URL`. En desarrollo se define en
`frontend/.env.local` como `http://localhost:8001` y debe usar el mismo puerto que
`backend/.env`. Después de cambiarla, reinicia `npm run dev` para que Next.js cargue
el nuevo valor.

## Para Correr Tests con Coverage en el Backend

pytest --cov=src --cov-report=xml:coverage.xml

pytest --cov=. --cov-report=xml

Luego, ejecutar el siguiente comando:

sonar

## Para Correr Tests con Coverage en el Frontend

npm test -- --coverage --coverageReporters=lcov --coverageDirectory=coverage

Luego, ejecutar el siguiente comando:

sonar
