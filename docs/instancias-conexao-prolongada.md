# Instâncias em conexão prolongada

Algumas instâncias ficam em conexão por muito tempo e não concluem. O cadastro continua ocupado e o cliente não consegue usar o número. Esta função acompanha essas instâncias e, depois de um prazo, desconecta ou exclui, conforme a escolha feita no provider.

Ela olha somente instâncias cadastradas no Hub que estejam em conexão na Evolution daquele provider. Vale para todos os produtos vinculados a ele. Uma instância conectada não é desconectada nem excluída. O tempo começa quando a instância passa a ser vista em conexão, não na data em que foi criada. Salvar a configuração recomeça essa contagem. A ação não sai no instante do clique: ela espera o prazo e a próxima consulta.

Se a desconexão for recusada porque a sessão já caiu, há uma tentativa extra, uma única vez: o código de conexão é gerado de novo e a desconexão é repetida. Se nesse intervalo a instância conectar de verdade, ela é deixada como está.

## Onde configurar

1. Entre no Manager.
2. No menu lateral, abra **Providers**.
3. No provider Evolution desejado, clique em **Gerenciar**.
4. Desça até o painel **Instâncias em conexão prolongada**.

O painel aparece no detalhe de provider Evolution. Se a tela disser que a API ainda não oferece esta manutenção, o restante do cadastro continua utilizável, mas este painel não altera instâncias.

## O que cada campo faz

**Verificar instâncias em conexão prolongada.** Liga ou desliga a função neste provider. Desligada, as consultas e as ações novas deste provider param. Uma chamada que já tenha saído pode terminar.

**Tempo máximo em conexão (minutos).** Quanto tempo a instância pode permanecer em conexão antes da ação. O texto **Prazo efetivo** mostra o valor que será usado. Campo vazio herda o padrão e não significa zero. O menor valor aceito é 1 minuto.

**Ação.**

- **Desconectar e manter cadastro:** encerra a sessão e conserva a instância no cadastro. A ocupação não é liberada.
- **Excluir a instância:** remove a instância de forma permanente, depois que a remoção é confirmada. Não dá para desfazer por este painel.

**Modo.**

- **Somente observar:** mostra o que ficaria elegível. Não desconecta e não exclui.
- **Executar ação:** aplica a ação escolhida depois do prazo.

**Produtos afetados.** Lista os produtos que compartilham este provider. A mesma configuração vale para todos eles.

**Salvar configuração.** Abre uma confirmação com provider, produtos, modo, ação e prazo. Só depois da confirmação a alteração é gravada. A contagem recomeça. Cancelar mantém o que estava na tela e não grava.

**Atualizar situação.** Relê o que já está salvo: prazo efetivo, avisos e quantidades. Não grava, não consulta a lista de instâncias e não desconecta.

**Ver acompanhamento.** Abre a lista só quando você pede. **Acompanhamento** mostra cada instância, se já está elegível e desde quando está em conexão. **Últimas ações** mostra o resultado. Fechar a janela interrompe novas leituras dessa lista.

## Exemplos

### Teste: desconectar depois de 15 minutos

Foi a configuração usada no teste, no provider cujo produto afetado é **Produto01**.

| Campo | Valor |
|---|---|
| Verificar instâncias em conexão prolongada | ligado |
| Tempo máximo em conexão (minutos) | 15 |
| Ação | Desconectar e manter cadastro |
| Modo | Executar ação |

Confirme na janela de salvar. Abaixo do tempo, **Prazo efetivo** deve mostrar 15 minutos. Uma instância que permanecer em conexão por 15 minutos observados pode ser desconectada. O cadastro dela permanece.

### Só acompanhar, sem alterar

| Campo | Valor |
|---|---|
| Verificar instâncias em conexão prolongada | ligado |
| Tempo máximo em conexão (minutos) | 15 |
| Ação | Desconectar e manter cadastro |
| Modo | Somente observar |

A ação escolhida não é aplicada. O acompanhamento indica o que estaria elegível.

### Excluir quem permanecer em conexão por 1 hora

| Campo | Valor |
|---|---|
| Verificar instâncias em conexão prolongada | ligado |
| Tempo máximo em conexão (minutos) | 60 |
| Ação | Excluir a instância |
| Modo | Executar ação |

Na confirmação, marque que a política vale para todos os produtos vinculados e que a exclusão é permanente. Sem essas confirmações, a exclusão não é gravada.

### Desligar neste provider

Desmarque **Verificar instâncias em conexão prolongada** e salve. As consultas e as ações novas deste provider param. Os outros providers não mudam. A configuração pode ser ligada de novo depois; a contagem recomeça.

### Usar o prazo padrão

Deixe **Tempo máximo em conexão (minutos)** vazio e salve. O **Prazo efetivo** mostra o padrão herdado. Vazio não é zero.

## Quando a configuração não altera instâncias

A situação no topo do painel precisa permitir execução. Dois avisos impedem a ação, mesmo com **Executar ação** salvo:

- manutenção global desabilitada;
- simulação global ativa: nenhuma instância será alterada.

Esses dois controles ficam fora do Manager. Enquanto o aviso estiver na tela, desconectar e excluir não ocorrem. **Atualizar situação** mostra o estado atual.

Uma instância conectada não entra na ação. Uma instância que acabou de entrar em conexão espera o prazo inteiro. Várias elegíveis ao mesmo tempo podem ser tratadas em consultas seguidas, não todas no mesmo minuto. **Ver acompanhamento** mostra quem ainda está aguardando e o resultado de quem já foi tratado.
