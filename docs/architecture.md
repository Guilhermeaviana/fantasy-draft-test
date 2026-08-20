# Arquitetura da Aplicação

## 1. Visão Geral

A aplicação é dividida em quatro responsabilidades principais:

- O React 18 gerencia a interface do usuário e o estado no lado do cliente.
- O Laravel 11 gerencia a autenticação, a validação e as regras de negócio.
- O PostgreSQL armazena o estado oficial da aplicação e garante a integridade dos dados.
- O Node.js com a biblioteca `ws` distribui atualizações em tempo real para os clientes conectados.

O princípio arquitetural fundamental é que a comunicação via WebSocket não substitui a API HTTP nem o banco de dados como fonte da verdade.

Um voto é primeiramente validado e persistido. Somente após uma operação bem-sucedida no banco de dados é que o novo resultado é propagado para os clientes conectados.

## 2. Arquitetura de Alto Nível

```text
React
| 
| HTTP
v
Laravel
| 
| autenticação
| validação
| regras de negócio
v
PostgreSQL
| 
| persistência bem-sucedida
v
Laravel
| 
| notificação interna
v
Node.js + ws
| 
| broadcast específico da enquete
v
Clientes React conectados
```

### Responsabilidades

#### React

Responsável por:

- renderizar o painel de enquetes;
- interface de criação de enquetes;
- interação de votação;
- visualização de resultados;
- estados de carregamento e erro;
- estado da conexão WebSocket;
- reconexão e sincronização de estado.

#### Laravel

Responsável por:

- autenticação de visitantes via Sanctum;
- endpoints da API;
- validação de requisições;
- criação de enquetes;
- regras de votação;
- tratamento de votos duplicados;
- regras de encerramento de enquetes;
- cálculo dos resultados das enquetes.

#### PostgreSQL

Responsável por:

- estado persistente da aplicação;
- relacionamentos entre usuários, enquetes, opções e votos;
- garantia de invariantes críticas de dados.

#### Node.js + ws

Responsável por:

- conexões WebSocket;
- assinaturas de enquetes;
- broadcast de alterações nos resultados;
- comunicação compatível com reconexão;
- detecção de conexões inativas.

## 3. Estrutura do Repositório

O projeto utiliza um monorepositório, pois o desafio envolve três aplicações que devem funcionar em conjunto, mas que fazem parte de um único produto de pequeno porte. ```text
fantasy-draft-test/
├── backend/
├── frontend/
├── websocket/
├── docs/
├── README.md
└── .gitignore
```

Isso mantém a configuração e a avaliação locais simples, preservando responsabilidades claras entre as aplicações.

## 4. Modelo de Domínio

O domínio inicial contém quatro entidades:

```text
User
Poll
PollOption
Vote
```

### User

Representa a identidade técnica de um participante.

O desafio não exige login ou cadastro tradicionais; portanto, os usuários são criados automaticamente como convidados (*guests*).

Um usuário pode:

- criar várias enquetes;
- votar em várias enquetes.

### Poll

Representa uma enquete criada por um usuário.

Principais atributos:

- ID inteiro;
- criador;
- pergunta;
- horário de encerramento opcional;
- *timestamps* (marcas de tempo).

Uma enquete:

- pertence a um criador;
- contém várias opções;
- contém vários votos.

### PollOption

Representa uma possível resposta.

Principais atributos:

- ID inteiro;
- ID da enquete;
- rótulo (*label*);
- posição;
- *timestamps*.

### Vote

Representa a escolha de um usuário em uma enquete.

Principais atributos:

- ID inteiro;
- ID da enquete;
- ID da opção da enquete;
- ID do usuário;
- *timestamp* de criação.

## 5. Integridade de Dados

Uma das regras de negócio mais importantes é:

> um usuário pode votar apenas uma vez na mesma enquete.

A validação na aplicação, por si só, não é suficiente, pois duas requisições simultâneas poderiam passar na verificação de existência antes que qualquer uma das inserções fosse concluída.

Por esse motivo, o PostgreSQL garantirá a restrição:

```text
UNIQUE (poll_id, user_id)
```

A aplicação ainda pode verificar a existência de um voto para retornar uma resposta clara, mas o banco de dados permanece como a garantia final de integridade.

O *backend* também deve verificar se a opção selecionada pertence à enquete que está recebendo o voto.

## 6. Autenticação de Convidado

O desafio exige que as rotas de enquete utilizem:

```text
auth:sanctum
```

ao mesmo tempo em que estabelece explicitamente que login e cadastro não são necessários.

Portanto, a aplicação utiliza uma identidade de convidado automática.

### Fluxo de inicialização do convidado

```text
React inicia
| 
v
solicita cookie CSRF
| 
v
POST /api/guest-session
| 
+---- existe sessão autenticada
| | 
| v
| reutilizar usuário
| 
+---- nenhuma sessão autenticada
| 
v
criar usuário convidado
| 
v
autenticar sessão
```

Após essa inicialização, as rotas de enquetes podem permanecer protegidas com `auth:sanctum`.

Isso fornece uma identidade técnica sem introduzir uma experiência de login ou cadastro que não foi solicitada pelo desafio.

### Limitação

Se o usuário remover os dados de sessão do navegador, a aplicação não poderá garantir que a mesma pessoa física será reconhecida novamente.

Uma garantia mais robusta exigiria uma identidade persistente do mundo real, o que está fora do escopo do desafio.

Portanto, a regra implementada por este projeto é: um voto por identidade de convidado autenticado, por enquete.

## 7. Criação de Enquete

A criação de uma enquete também cria todas as suas opções.

Essas operações formam uma unidade lógica e devem ser executadas dentro de uma transação de banco de dados.

```text
criar enquete
|
criar opções
|
todas as operações bem-sucedidas? 
| 
sim ---> commit
não ---> rollback
```

Isso evita que uma enquete incompleta seja persistida caso a criação de opções falhe.

## 8. Fluxo de Votação

Um voto segue este caminho:

```text
POST /api/polls/{poll}/votes
| 
v
Autenticação via Sanctum
| 
v
Validação da requisição
| 
v
Verificação do estado da enquete
| 
v
Verificação se a opção pertence à enquete
| 
v
Verificação de voto anterior
| 
v
Persistência do voto
| 
v
Commit no banco de dados
| 
v
Cálculo dos resultados atuais
| 
v
Notificação do serviço em tempo real
```

Uma falha na entrega via WebSocket não deve desfazer (rollback) um voto que já foi persistido com sucesso.

## 9. Responsabilidades de HTTP e WebSocket

O HTTP é utilizado para comandos e para a obtenção do estado oficial (autoritativo).

Exemplos:

- criar enquete;
- listar enquetes;
- carregar enquete;
- enviar voto.

O WebSocket é utilizado para notificar clientes conectados sobre mudanças de estado.

Isso mantém as regras de negócio dentro do Laravel, em vez de duplicá-las no servidor Node.js.

## 10. Assinaturas em Tempo Real

Um cliente conectado assina apenas a enquete que está sendo visualizada no momento.

Exemplo:

```json
{
"type": "poll.subscribe",
"pollId": 12
}
```

Conceitualmente, o servidor WebSocket mantém grupos como:

```text
poll:12
├── cliente A
├── cliente B
└── cliente C

poll:20
├── cliente D
└── cliente E
```

Uma atualização na enquete 12 é enviada apenas para os clientes A, B e C.

Isso modela a mesma interação geral em tempo real baseada em "salas" descrita no desafio, sem transmitir eventos não relacionados para todos os clientes conectados.

## 11. Comunicação entre Laravel e WebSocket

Após uma mutação bem-sucedida, o Laravel precisa notificar o serviço WebSocket em Node.js.

A implementação inicial utiliza uma requisição HTTP interna.

```text
Laravel
| 
| requisição HTTP interna
v
Node.js
| 
v
Assinantes do WebSocket
```

Essa abordagem foi escolhida por ser:

- explícita;
- fácil de entender; - fácil de testar localmente;
- suficiente para o escopo do desafio;
- livre de dependências de infraestrutura adicionais, como o Redis.

Caso esta aplicação precisasse operar em uma escala muito maior, um *message broker* assíncrono poderia ser avaliado posteriormente.

## 12. Estratégia de Payload em Tempo Real

As atualizações de resultados conterão o *snapshot* (estado atual) dos resultados, em vez de apenas um incremento de voto.

Exemplo:

```json
{
"type": "poll.results.updated",
"pollId": 12,
"payload": {
"total_votes": 128,
"options": []
}
}
```

Os *payloads* de resultados da enquete são pequenos; portanto, enviar o *snapshot* atual simplifica o *frontend* e reduz problemas de sincronização causados ​​por eventos incrementais perdidos ou duplicados.

## 13. Estratégia de Reconexão

A entrega via WebSocket não é garantida enquanto o cliente estiver desconectado.

Exemplo:

```text
cliente exibe 50 votos
|
conexão perdida
|
votos 51, 52 e 53 ocorrem
|
conexão restaurada
```

Simplesmente reconectar deixaria o cliente com um estado desatualizado.

Por esse motivo, a reconexão segue este fluxo:

```text
conexão restaurada
|
inscrever-se novamente
|
recarregar enquete via HTTP
|
substituir estado local
|
continuar recebendo eventos
```

O WebSocket informa ao cliente que algo mudou.

A API HTTP fornece o estado oficial (fonte da verdade).

## 14. Saúde da Conexão

O servidor WebSocket utilizará verificações de *heartbeat* do tipo *ping/pong*.

Isso permite que o servidor detecte clientes que não estão mais acessíveis, mesmo quando a conexão não foi encerrada de forma limpa.

Conexões inativas podem, então, ser removidas dos grupos de inscrição ativos.

## 15. Encerramento da Enquete

O *backend* determina se a votação ainda é permitida utilizando o valor `closes_at` da enquete.

O *frontend* pode exibir uma contagem regressiva, mas nunca se confia no relógio do navegador para autorizar um voto.

```text
Contagem regressiva no frontend
=
experiência do usuário

Validação de closes_at no backend
=
regra de negócio
```

Isso impede que manipulações no lado do cliente contornem as regras de encerramento da enquete.

## 16. Estratégia de Resposta da API

O desafio exige respostas diretas em JSON, sem um *wrapper* (invólucro) de nível superior chamado `data`. Recursos (Resources) ainda podem ser utilizados no Laravel, mas o encapsulamento (*wrapping*) deve ser desativado.

As respostas da enquete podem conter informações derivadas, tais como:

- status atual;
- total de votos;
- contagem de votos por opção;
- porcentagem por opção;
- se o usuário autenticado já votou;
- qual opção o usuário autenticado selecionou.

Valores derivados, como porcentagens e o status da enquete, não precisam ser persistidos como campos separados no banco de dados.

## 17. Estratégia de Erros

Conflitos de domínio esperados devem retornar códigos de status HTTP significativos e códigos de erro legíveis por máquinas.

Exemplo:

```json
{
"message": "Você já votou nesta enquete.",
"code": "already_voted"
}
```

Casos de domínio importantes incluem:

- `already_voted`;
- `poll_closed`;
- `invalid_option`.

Isso permite que a interface React reaja a erros conhecidos sem depender apenas de texto legível por humanos.

## 18. Principais decisões técnicas e *trade-offs*

### Sessão de convidado em vez de autenticação tradicional

Escolha feita porque a autenticação via Sanctum é necessária, enquanto o login e o cadastro estão explicitamente fora do escopo do desafio.

### Restrição de banco de dados para votos duplicados

Escolha feita porque verificações apenas na aplicação não garantem a integridade em cenários de requisições concorrentes.

### HTTP para mutações e WebSocket para propagação

Escolha feita para centralizar as regras de negócio em um único responsável: o Laravel.

### HTTP interno entre Laravel e Node.js

Escolha feita para evitar a adição de infraestrutura desnecessária a um desafio técnico de pequeno porte.

### *Snapshot* do resultado em vez de eventos incrementais

Escolha feita porque os *payloads* de resultados da enquete são pequenos, simplificando a sincronização.

### Monorepositório

Escolha feita porque o *backend*, o *frontend* e o servidor WebSocket fazem parte de uma única entrega e precisam ser fáceis de executar localmente pelo avaliador.