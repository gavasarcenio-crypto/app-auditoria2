import { StyleSheet } from 'react-native';

// Paleta única do app (tema "campo/auditoria agrícola")
export const cores = {
  fundo: '#EDF1EC',
  superficie: '#FFFFFF',
  primaria: '#1B7F5A',
  primariaEscura: '#125D42',
  texto: '#16211C',
  textoSuave: '#6B7A72',
  borda: '#D9E2DB',
  alerta: '#D98014',
  perigo: '#C0392B',
  neutro: '#95A5A6',
  precisaoAlta: '#2E9E5B',
  precisaoMedia: '#E2B203',
  precisaoBaixa: '#C0392B',
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    padding: 16,
    paddingBottom: 48,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  // RNF02: em paisagem os cards ficam lado a lado
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: cores.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 16,
    marginBottom: 14,
  },
  cabecalhoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tituloSecao: {
    fontSize: 16,
    fontWeight: '700',
    color: cores.texto,
    flexShrink: 1,
  },
  textoInformativo: {
    fontSize: 14,
    color: cores.textoSuave,
    marginVertical: 3,
  },
  dado: {
    fontSize: 15,
    color: cores.texto,
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 12,
    resizeMode: 'cover',
    backgroundColor: cores.borda,
  },
  itemContato: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    marginTop: 8,
  },
  itemContatoSelecionado: {
    borderColor: cores.primaria,
    backgroundColor: '#E8F3EE',
  },
  nomeContato: {
    fontSize: 15,
    fontWeight: '600',
    color: cores.texto,
  },
  telefoneContato: {
    fontSize: 13,
    color: cores.textoSuave,
    marginTop: 2,
  },
  // Bloco de mensagem amigável (RNF01: degradação graciosa)
  aviso: {
    backgroundColor: '#FDF4E3',
    borderLeftWidth: 4,
    borderLeftColor: cores.alerta,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  avisoTexto: {
    fontSize: 13,
    color: '#7A5210',
    lineHeight: 19,
  },
  divisor: {
    height: 1,
    backgroundColor: cores.borda,
    marginVertical: 12,
  },
  vazio: {
    alignItems: 'center',
    padding: 32,
  },
  vazioTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: cores.texto,
    marginBottom: 6,
    textAlign: 'center',
  },
  vazioTexto: {
    fontSize: 14,
    color: cores.textoSuave,
    textAlign: 'center',
    lineHeight: 20,
  },
});
