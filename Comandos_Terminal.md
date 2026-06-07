## Para Correr el Backend

Instalamos dependencias:

pip install --upgrade pip

pip install -r requirements.txt

Corremos el backend, con cualquiera de estos dos comandos:

py main.py

python main.py

## Para Correr el Frontend

Instalamos dependencias:

npm install

Corremos el frontend, con cualquiera de estos dos comandos:

npm run dev

pnpm dev

## Para Correr Tests con Coverage en el Backend

pytest --cov=src --cov-report=xml:coverage.xml

## Para Correr Tests con Coverage en el Frontend

npm test -- --coverage --coverageReporters=lcov --coverageDirectory=coverage
