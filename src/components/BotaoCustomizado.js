import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { cores } from '../styles/globalStyles';

export default function BotaoCustomizado({
  titulo,
  onPress,
  tipo = 'primary',
  carregando = false,
  desabilitado = false,
}) {
  const obterCorFundo = () => {
    switch (tipo) {
      case 'success':
        return cores.primariaEscura;
      case 'warning':
        return cores.alerta;
      case 'danger':
        return cores.perigo;
      case 'ghost':
        return 'transparent';
      default:
        return cores.primaria;
    }
  };

  const inativo = desabilitado || carregando;
  const ehGhost = tipo === 'ghost';

  return (
    <TouchableOpacity
      style={[
        styles.botao,
        { backgroundColor: obterCorFundo() },
        ehGhost && styles.botaoGhost,
        inativo && styles.botaoInativo,
      ]}
      onPress={onPress}
      disabled={inativo}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={titulo}
    >
      <View style={styles.conteudo}>
        {carregando && (
          <ActivityIndicator
            size="small"
            color={ehGhost ? cores.primaria : '#FFFFFF'}
            style={styles.spinner}
          />
        )}
        <Text style={[styles.textoBotao, ehGhost && styles.textoGhost]}>{titulo}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    width: '100%',
  },
  botaoGhost: {
    borderWidth: 1,
    borderColor: cores.primaria,
  },
  botaoInativo: {
    opacity: 0.5,
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  textoBotao: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  textoGhost: {
    color: cores.primaria,
  },
});
