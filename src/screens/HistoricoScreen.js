import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { cores, globalStyles } from '../styles/globalStyles';
import BotaoCustomizado from '../components/BotaoCustomizado';
import IndicadorPrecisao from '../components/IndicadorPrecisao';
import { limparHistorico, listarAuditorias } from '../services/historicoStorage';

function formatarData(iso) {
  try {
    const data = new Date(iso);
    return data.toLocaleString('pt-BR');
  } catch (erro) {
    return iso;
  }
}

export default function HistoricoScreen() {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const lista = await listarAuditorias();
    setRegistros(lista);
    setCarregando(false);
  }, []);

  // Recarrega sempre que a tela volta ao foco (apos assinar uma auditoria nova)
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  function confirmarLimpeza() {
    Alert.alert(
      'Apagar histórico',
      'Todas as auditorias gravadas neste aparelho serão removidas. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            await limparHistorico();
            carregar();
          },
        },
      ]
    );
  }

  function renderizarItem({ item }) {
    return (
      <View style={globalStyles.card}>
        <View style={globalStyles.cabecalhoCard}>
          <Text style={globalStyles.tituloSecao}>{item.produtorNome ?? 'Produtor não informado'}</Text>
          <IndicadorPrecisao precisao={item.precisao} compacto />
        </View>

        <Text style={globalStyles.textoInformativo}>{formatarData(item.criadoEm)}</Text>

        {item.produtorTelefone && (
          <Text style={globalStyles.textoInformativo}>{item.produtorTelefone}</Text>
        )}

        <View style={globalStyles.divisor} />

        <Text style={globalStyles.dado}>
          {item.latitude?.toFixed(6)}, {item.longitude?.toFixed(6)}
        </Text>
        {item.picoAceleracao !== null && item.picoAceleracao !== undefined && (
          <Text style={globalStyles.textoInformativo}>
            Pico de aceleração na assinatura: {item.picoAceleracao.toFixed(2)} g
          </Text>
        )}

        {item.imagemUri && <Image source={{ uri: item.imagemUri }} style={globalStyles.imagePreview} />}
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={registros}
        keyExtractor={(item) => item.id}
        renderItem={renderizarItem}
        contentContainerStyle={[globalStyles.conteudo, registros.length === 0 && styles.listaVazia]}
        refreshControl={
          <RefreshControl refreshing={carregando} onRefresh={carregar} colors={[cores.primaria]} />
        }
        ListEmptyComponent={
          !carregando ? (
            <View style={globalStyles.vazio}>
              <Text style={globalStyles.vazioTitulo}>Nenhuma auditoria gravada</Text>
              <Text style={globalStyles.vazioTexto}>
                As visitas assinadas ficam salvas aqui no aparelho e podem ser consultadas sem internet.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          registros.length > 0 ? (
            <BotaoCustomizado titulo="Apagar histórico" onPress={confirmarLimpeza} tipo="danger" />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listaVazia: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
