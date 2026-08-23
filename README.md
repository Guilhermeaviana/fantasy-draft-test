# FantasyDraft Live Polls

Teste técnico para a vaga de Desenvolvedor(a) Full Stack Júnior da FantasyDraft.

Aplicação de enquetes com votação e atualização dos resultados em tempo real utilizando Laravel, React, PostgreSQL e WebSocket.

## Tecnologias

- PHP 8.3
- Laravel 11
- Laravel Sanctum
- PostgreSQL
- React 18
- Node.js
- `ws`

## Como rodar o projeto localmente

### Pré-requisitos

Tenha instalado:

- PHP 8.3
- Composer
- PostgreSQL
- Node.js
- npm

### 1. Clone o repositório

```bash
git clone https://github.com/Guilhermeaviana/fantasy-draft-test.git
cd fantasy-draft-test

2. Crie o banco PostgreSQL
createdb fantasy_draft_test
3. Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate

Confira as configurações do banco no .env:

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fantasy_draft_test
DB_USERNAME=postgres
DB_PASSWORD=

Ajuste usuário e senha conforme sua instalação local.

Execute as migrations:

php artisan migrate

Para carregar os eventos esportivos:

php artisan sports:sync-events

Inicie o backend:

php artisan serve --host=127.0.0.1 --port=8000
4. Servidor WebSocket

Abra outro terminal:

cd realtime
npm install
cp .env.example .env
npm run dev

O REALTIME_INTERNAL_SECRET deve ser igual no .env do backend e do realtime.

Configuração padrão:

REALTIME_HOST=127.0.0.1
REALTIME_PORT=8081
REALTIME_INTERNAL_SECRET=change-me

No backend:

REALTIME_SERVER_URL=http://127.0.0.1:8081
REALTIME_INTERNAL_SECRET=change-me
5. Frontend

Abra outro terminal:

cd frontend
npm install
cp .env.example .env.local
npm run dev -- --host 127.0.0.1

Configuração padrão:

VITE_API_URL=http://127.0.0.1:8000
VITE_REALTIME_URL=ws://127.0.0.1:8081

Acesse:

http://127.0.0.1:5173
Resumo

A aplicação precisa de três processos rodando ao mesmo tempo:

Backend:   http://127.0.0.1:8000
Realtime:  ws://127.0.0.1:8081
Frontend:  http://127.0.0.1:5173
Testes

Backend:

cd backend
php artisan test

Última execução:

25 testes aprovados
120 assertions

Frontend:

cd frontend
npm run lint
npm run build

Lint e build foram executados com sucesso antes da entrega.

Tempo de desenvolvimento

Tempo aproximado: 9 horas.

O tempo não foi cronometrado durante o desenvolvimento, portanto o valor informado é uma estimativa.

Partes mais difíceis
Atualização em tempo real

O principal cuidado foi garantir que o voto fosse validado e persistido no banco antes de publicar a atualização pelo WebSocket, evitando divergência entre o estado salvo e o exibido aos usuários.

Voto único sem login

Como o desafio não exigia login ou cadastro, foi necessário criar uma forma de identificar os usuários para impedir votos duplicados. A solução utilizada foi uma identidade guest autenticada com Laravel Sanctum.

Encerramento automático

O frontend exibe o tempo restante da enquete, mas a validação de encerramento precisa acontecer no backend. A regra foi centralizada utilizando closes_at, garantindo que votos enviados após o prazo sejam rejeitados.

Integração esportiva

Como diferencial, foi adicionada integração com o TheSportsDB. A principal dificuldade foi normalizar eventos e status diferentes entre os esportes para um formato consistente dentro da aplicação.