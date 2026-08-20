# Requisitos do Produto

## Objetivo

Criar um painel de enquetes em tempo real onde os usuários possam criar enquetes, votar e acompanhar as alterações nos resultados em tempo real, sem recarregar a página.

A funcionalidade deve representar, em menor escala, o mesmo padrão de interação multiusuário em tempo real utilizado nas salas ao vivo do FantasyDraft.

## Referências do Produto

A direção do produto baseia-se em:

- FantasyDraft: para identidade visual, estrutura do lobby, cards, *pills* (etiquetas), estados de tela vazia, formulários e linguagem voltada para esportes.
- Sleeper: para UX de esportes ao vivo, apresentação de estado em tempo real e padrões de exibição de resultados de enquetes.

O objetivo não é copiar nenhuma das interfaces, mas criar uma funcionalidade que pareça consistente com o produto FantasyDraft.

## Atores

### Usuário convidado

Um visitante recebe uma identidade de convidado criada automaticamente e pode:

- navegar pelas enquetes;
- criar enquetes;
- abrir uma enquete;
- votar uma vez;
- acompanhar os resultados em tempo real.

Não há fluxo tradicional de login ou cadastro.

## Requisitos Funcionais

### RF01 — Sessão de convidado

A aplicação deve criar ou restaurar uma sessão de convidado para que as rotas protegidas de enquetes possam utilizar a autenticação Sanctum sem exigir login ou cadastro.

### RF02 — Painel de enquetes

O usuário deve conseguir visualizar as enquetes disponíveis e distinguir enquetes abertas de enquetes encerradas.

### RF03 — Criação de enquete

O usuário deve conseguir criar uma enquete contendo:

- uma pergunta;
- pelo menos duas opções;
- uma duração opcional para o encerramento.

### RF04 — Detalhes da enquete

O usuário deve conseguir abrir uma enquete e visualizar seu estado atual.

### RF05 — Votação

Um usuário convidado autenticado deve conseguir selecionar uma opção e enviar um voto.

### RF06 — Prevenção de voto duplicado

O usuário não deve conseguir votar mais de uma vez na mesma enquete.

### RF07 — Resultados em tempo real

Quando um voto válido é registrado, os usuários que estiverem visualizando aquela enquete devem receber os resultados atualizados sem recarregar a página.

### RF08 — Encerramento da enquete

Quando uma enquete tiver um horário de encerramento e esse horário for atingido, novos votos devem ser rejeitados.

### RF09 — Visualização de resultados

Os resultados devem exibir:

- contagem de votos por opção;
- porcentagem por opção;
- total de votos. ### RF10 — Estado da conexão em tempo real

A interface deve indicar quando a conexão ativa está em funcionamento ou sendo restabelecida.

### RF11 — Sincronização após reconexão

Após uma reconexão via WebSocket, o cliente deve buscar novamente o estado oficial da enquete antes de prosseguir.

## Regras de Negócio

### RN01

Uma pergunta para a enquete é obrigatória.

### RN02

Uma enquete deve conter entre 2 e 10 opções válidas.

### RN03

Opções de enquete vazias não são aceitas.

### RN04

Uma opção de voto deve pertencer à enquete que está recebendo o voto.

### RN05

Um usuário pode registrar apenas um voto por enquete.

### RN06

O criador da enquete tem permissão para votar.

### RN07

Uma enquete encerrada não pode receber novos votos.

### RN08

Um horário de encerramento nulo significa que a enquete não será encerrada automaticamente.

### RN09

O backend detém a autoridade para decidir se uma enquete está encerrada.

### RN10

Uma atualização em tempo real só deve ser emitida após o voto ter sido persistido com sucesso.

### RN11

O bloqueio de votos no frontend melhora a experiência do usuário, mas não pode ser a única proteção contra votos duplicados.

### RN12

O banco de dados deve garantir a regra de negócio de "um voto por usuário por enquete".

## Requisitos Não Funcionais

### RNF01

O backend deve utilizar Laravel 11 com PHP 8.3.

### RNF02

A persistência de dados deve utilizar PostgreSQL.

### RNF03

O frontend deve utilizar React 18.

### RNF04

A comunicação em tempo real deve utilizar Node.js com a biblioteca WebSocket `ws`.

### RNF05

As chaves primárias do banco de dados devem utilizar IDs inteiros com incremento automático.

### RNF06

As rotas do domínio de enquetes devem ser protegidas pelo middleware `auth:sanctum`.

### RNF07

As respostas da API devem retornar JSON direto, sem um invólucro (wrapper) de nível superior chamado `data`.

### RNF08

O código React deve ser componentizado, e os hooks devem manter a organização de efeitos colaterais e da lógica de estado.

### RNF09

Os estilos devem utilizar CSS Modules ou uma abordagem de escopo equivalente. ### RNF10

O servidor WebSocket deve suportar assinaturas específicas por enquete, em vez de transmitir todos os eventos para todas as conexões.

### RNF11

O servidor WebSocket deve detectar conexões inativas.

### RNF12

Configurações e segredos devem ser fornecidos por meio de variáveis ​​de ambiente.

### RNF13

Regras de negócio críticas devem possuir testes automatizados.

## Principais Histórias de Usuário

### US01 — Visualizar enquetes

Como participante, quero visualizar as enquetes disponíveis para poder escolher uma na qual participar.

### US02 — Criar uma enquete

Como participante, quero criar uma enquete com uma pergunta e opções para que outros usuários possam votar.

### US03 — Votar

Como participante, quero escolher uma opção para que meu voto seja contabilizado na enquete.

### US04 — Impedir votos duplicados

Como sistema, quero impedir que o mesmo participante vote duas vezes, para garantir a consistência dos resultados da enquete.

### US05 — Acompanhar resultados em tempo real

Como participante, quero que os resultados da enquete sejam atualizados automaticamente à medida que outros usuários votam, para que eu possa acompanhar a enquete em tempo real.

### US06 — Encerrar enquete automaticamente

Como criador da enquete, quero definir opcionalmente por quanto tempo a votação permanecerá aberta, para que a enquete possa ser encerrada automaticamente.

## Critérios de Aceitação Principais

### Criação de enquete

Dado que existe uma sessão de convidado válida
Quando o usuário envia uma pergunta com pelo menos duas opções válidas
Então a enquete e suas opções são persistidas
E a enquete criada pode ser aberta.

### Voto válido

Dada uma enquete aberta
E que o usuário atual ainda não votou
Quando o usuário seleciona uma opção pertencente àquela enquete
Então exatamente um voto é persistido
E os resultados atualizados são retornados.

### Voto duplicado

Dado que o usuário atual já votou em uma enquete
Quando outro voto é enviado para a mesma enquete
Então a requisição é rejeitada
E nenhum voto adicional é persistido.

### Enquete encerrada

Dado que o horário de encerramento da enquete já passou
Quando um usuário tenta votar
Então a requisição é rejeitada
E os resultados da enquete permanecem inalterados.

### Atualização em tempo real

Dado que múltiplos usuários estão visualizando a mesma enquete
Quando um usuário registra um voto válido
Então os usuários conectados recebem o resultado atualizado sem recarregar a página.

### Reconexão

Dado que um usuário perde temporariamente a conexão WebSocket
Quando a conexão é restabelecida
Então o cliente se inscreve novamente na enquete
E recarrega o estado atual e oficial da enquete.