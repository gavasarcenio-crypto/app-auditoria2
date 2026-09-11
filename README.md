# Registro de Visitas Técnicas Agrícolas

Aplicativo React Native (Expo) para auditoria técnica em campo. Reúne quatro recursos nativos do
aparelho — câmera, GPS, agenda de contatos e acelerômetro — e grava os relatórios no armazenamento
local para consulta offline.

## Desafios implementados

- **Nível Júnior** — tratamento de permissão negada com `canAskAgain`. Quando o usuário marca
  "Não perguntar novamente", o app abre as configurações do sistema em vez de exibir um erro genérico.
- **Nível Pleno** — trava de segurança por movimento. Ao assinar a auditoria o acelerômetro é lido
  por 1,5 s e o envio é bloqueado com o alerta "Instabilidade Física Detectada" se o pico da
  aceleração vetorial agregada passar de 2.0 g.

## Requisitos atendidos

| Item | Onde está |
|------|-----------|
| RF01 – Histórico local | `src/services/historicoStorage.js` + `src/screens/HistoricoScreen.js` (AsyncStorage) |
| RF02 – Precisão do GPS | `src/components/IndicadorPrecisao.js` (verde < 10 m, amarelo 10–30 m, vermelho > 30 m) |
| RNF01 – Degradação graciosa | Verificações de disponibilidade e `try/catch` em cada recurso de `RegistroVisitaScreen.js` |
| RNF02 – UI responsiva | `useWindowDimensions` + `globalStyles.grade` (cards lado a lado em paisagem) |

## Como rodar

```bash
git clone "link do repositorio"
cd app-auditoria
npx expo install expo-image-picker expo-location expo-contacts expo-sensors expo-status-bar
npx expo install @react-native-async-storage/async-storage
npx expo install @react-navigation/native @react-navigation/native-stack \
  react-native-screens react-native-safe-area-context

npx expo start 
```

Depois copie os arquivos deste repositório para dentro do projeto, leia o QR Code com o **Expo Go**
e abra o app em um aparelho físico (o acelerômetro e a câmera não funcionam bem em emulador).

## Estrutura

```
app-auditoria/
├── App.js
├── app.json
└── src/
    ├── components/
    │   ├── BotaoCustomizado.js
    │   └── IndicadorPrecisao.js
    ├── screens/
    │   ├── RegistroVisitaScreen.js
    │   └── HistoricoScreen.js
    ├── services/
    │   └── historicoStorage.js
    └── styles/
        └── globalStyles.js
```
