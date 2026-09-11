import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cores } from '../styles/globalStyles';

/**
 * RF02 - Feedback visual da precisao do GPS.
 * Verde: alta precisao (< 10m) | Amarelo: media (10m a 30m) | Vermelho: baixa (> 30m)
 */
export function classificarPrecisao(precisaoEmMetros) {
  if (precisaoEmMetros === null || precisaoEmMetros === undefined) {
    return { cor: cores.neutro, rotulo: 'Sem sinal', nivel: 'indefinido' };
  }
  if (precisaoEmMetros < 10) {
    return { cor: cores.precisaoAlta, rotulo: 'Alta precisão', nivel: 'alta' };
  }
  if (precisaoEmMetros <= 30) {
    return { cor: cores.precisaoMedia, rotulo: 'Precisão média', nivel: 'media' };
  }
  return { cor: cores.precisaoBaixa, rotulo: 'Baixa precisão', nivel: 'baixa' };
}

export default function IndicadorPrecisao({ precisao, compacto = false }) {
  const { cor, rotulo } = classificarPrecisao(precisao);
  const metros = precisao === null || precisao === undefined ? '--' : `${precisao.toFixed(1)} m`;

  return (
    <View style={[styles.container, { borderColor: cor }]}>
      <View style={[styles.bolinha, { backgroundColor: cor }]} />
      <Text style={[styles.texto, { color: cor }]}>
        {compacto ? metros : `${rotulo} · ${metros}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  bolinha: {
    width: 9,
    height: 9,
    borderRadius: 999,
    marginRight: 6,
  },
  texto: {
    fontSize: 12,
    fontWeight: '600',
  },
});
