import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts/legacy';
import { Accelerometer } from 'expo-sensors';

import { cores, globalStyles } from '../styles/globalStyles';
import BotaoCustomizado from '../components/BotaoCustomizado';
import IndicadorPrecisao from '../components/IndicadorPrecisao';
import { salvarAuditoria } from '../services/historicoStorage';

// --- Parametros do desafio Pleno (telemetria com acelerometro) ---
const LIMITE_G = 2.0; // aceleracao vetorial agregada maxima permitida
const JANELA_ANALISE_MS = 1500; // tempo de leitura do sensor durante o fechamento
const INTERVALO_SENSOR_MS = 100; // frequencia de amostragem (10 leituras por segundo)

export default function RegistroVisitaScreen({ navigation }) {
  // Dados consolidados da auditoria
  const [localizacao, setLocalizacao] = useState(null);
  const [imagemEvidencia, setImagemEvidencia] = useState(null);
  const [contatoSelecionado, setContatoSelecionado] = useState(null);
  const [listaContatos, setListaContatos] = useState([]);

  // Mensagens amigaveis de falha (RNF01)
  const [avisoGps, setAvisoGps] = useState(null);
  const [avisoCamera, setAvisoCamera] = useState(null);
  const [avisoContatos, setAvisoContatos] = useState(null);
  const [avisoSensor, setAvisoSensor] = useState(null);

  // Estados de carregamento
  const [carregandoGps, setCarregandoGps] = useState(false);
  const [carregandoContatos, setCarregandoContatos] = useState(false);
  const [verificandoEstabilidade, setVerificandoEstabilidade] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Sensor
  const [sensorDisponivel, setSensorDisponivel] = useState(true);
  const [aceleracaoAtual, setAceleracaoAtual] = useState(0);
  const analisandoRef = useRef(false); // liga/desliga a captura do pico
  const picoRef = useRef(0); // maior aceleracao lida dentro da janela

  // RNF02: layout adapta-se a orientacao e ao tamanho da tela
  const { width, height } = useWindowDimensions();
  const paisagem = width > height;
  const estiloCard = [globalStyles.card, paisagem ? { width: '49%' } : { width: '100%' }];

  /**
   * Assinatura unica do acelerometro, criada no mount e removida no unmount.
   * Manter uma unica inscricao evita listeners orfaos (vazamento de memoria).
   */
  useEffect(() => {
    let inscricao = null;
    let montado = true;

    async function iniciarSensor() {
      try {
        const disponivel = await Accelerometer.isAvailableAsync();
        if (!montado) return;

        if (!disponivel) {
          setSensorDisponivel(false);
          setAvisoSensor(
            'Este aparelho não possui acelerômetro. A trava de estabilidade fica desativada e a auditoria pode ser assinada normalmente.'
          );
          return;
        }

        Accelerometer.setUpdateInterval(INTERVALO_SENSOR_MS);
        inscricao = Accelerometer.addListener(({ x, y, z }) => {
          // Aceleracao vetorial agregada: modulo do vetor (x, y, z), em g.
          // Parado sobre a mesa o valor fica proximo de 1.00g por causa da gravidade.
          const modulo = Math.sqrt(x * x + y * y + z * z);
          setAceleracaoAtual(modulo);
          if (analisandoRef.current && modulo > picoRef.current) {
            picoRef.current = modulo;
          }
        });
      } catch (erro) {
        if (!montado) return;
        setSensorDisponivel(false);
        setAvisoSensor('Não foi possível iniciar o acelerômetro. A trava de estabilidade está desativada.');
      }
    }

    iniciarSensor();

    return () => {
      montado = false;
      analisandoRef.current = false;
      if (inscricao) inscricao.remove();
    };
  }, []);

  /**
   * NIVEL JUNIOR - tratamento avancado de permissao negada.
   * Quando canAskAgain volta false o sistema nao exibe mais o dialogo nativo,
   * entao a unica saida e levar o usuario ate as configuracoes do SO.
   */
  function alertarPermissaoBloqueada(nomeRecurso) {
    const caminho =
      Platform.OS === 'android'
        ? 'Configurações > Apps > Expo Go > Permissões'
        : 'Ajustes > Expo Go';

    Alert.alert(
      `Acesso ${nomeRecurso} bloqueado`,
      `Você marcou "Não perguntar novamente", então o app não consegue mais pedir essa permissão.\n\n` +
        `Para reativar: ${caminho} e libere ${nomeRecurso}.`,
      [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
      ]
    );
  }

  // --- 1. Georreferenciamento do lote (GPS) ---
  async function capturarCoordenadasGPS() {
    setCarregandoGps(true);
    setAvisoGps(null);
    try {
      // RNF01: GPS desligado no aparelho nao pode derrubar o app
      const servicosAtivos = await Location.hasServicesEnabledAsync();
      if (!servicosAtivos) {
        setAvisoGps('A localização do aparelho está desligada. Ative o GPS nas configurações rápidas e toque novamente.');
        return;
      }

      const permissao = await Location.requestForegroundPermissionsAsync();
      if (!permissao.granted) {
        if (!permissao.canAskAgain) {
          alertarPermissaoBloqueada('à localização');
        }
        setAvisoGps('Sem permissão de localização não é possível georreferenciar o lote auditado.');
        return;
      }

      const posicao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocalizacao(posicao.coords);
    } catch (erro) {
      setAvisoGps('Não foi possível obter as coordenadas agora. Verifique o sinal em campo aberto e tente novamente.');
    } finally {
      setCarregandoGps(false);
    }
  }

  // --- 2. Evidencia fotografica (Camera) ---
  async function capturarFotoEvidencia() {
    setAvisoCamera(null);
    try {
      const permissao = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissao.granted) {
        if (!permissao.canAskAgain) {
          alertarPermissaoBloqueada('à câmera');
          setAvisoCamera('Permissão de câmera bloqueada pelo sistema. Reative nas configurações do aparelho.');
        } else {
          Alert.alert(
            'Permissão necessária',
            'A comprovação fotográfica é obrigatória para validar a auditoria. Toque de novo e permita o acesso à câmera.'
          );
        }
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        quality: 0.6,
        allowsEditing: false,
      });

      if (!resultado.canceled) {
        setImagemEvidencia(resultado.assets[0].uri);
      }
    } catch (erro) {
      // RNF01: aparelho sem camera ou camera em uso por outro app
      setAvisoCamera('Não foi possível abrir a câmera neste aparelho. Verifique se outro app está usando o recurso.');
    }
  }

  // --- 3. Produtor / representante (Contatos) ---
  async function carregarContatosProdutores() {
    setCarregandoContatos(true);
    setAvisoContatos(null);
    try {
      const permissao = await Contacts.requestPermissionsAsync();
      if (!permissao.granted) {
        if (!permissao.canAskAgain) {
          alertarPermissaoBloqueada('à agenda');
        }
        setAvisoContatos('Sem acesso à agenda não é possível vincular o produtor responsável pela área.');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        pageSize: 20,
        pageOffset: 0,
      });

      if (!data || data.length === 0) {
        setAvisoContatos('Nenhum contato encontrado na agenda deste aparelho.');
        setListaContatos([]);
        return;
      }

      setListaContatos(data);
    } catch (erro) {
      setAvisoContatos('Não foi possível ler a agenda do aparelho.');
    } finally {
      setCarregandoContatos(false);
    }
  }

  function limparFormulario() {
    setLocalizacao(null);
    setImagemEvidencia(null);
    setContatoSelecionado(null);
    setListaContatos([]);
  }

  /**
   * NIVEL PLENO - trava de seguranca por movimento.
   * Durante JANELA_ANALISE_MS o app guarda o maior modulo de aceleracao lido.
   * Se o pico ultrapassar LIMITE_G o envio e bloqueado.
   */
  async function finalizarRelatorioAuditoria() {
    if (!localizacao || !imagemEvidencia || !contatoSelecionado) {
      Alert.alert(
        'Auditoria incompleta',
        'Preencha os três critérios antes de assinar: coordenadas do lote, evidência fotográfica e produtor vinculado.'
      );
      return;
    }

    let picoMedido = null;

    if (sensorDisponivel) {
      picoRef.current = 0;
      analisandoRef.current = true;
      setVerificandoEstabilidade(true);

      await new Promise((resolve) => setTimeout(resolve, JANELA_ANALISE_MS));

      analisandoRef.current = false;
      setVerificandoEstabilidade(false);
      picoMedido = picoRef.current;

      if (picoMedido > LIMITE_G) {
        Alert.alert(
          'Instabilidade Física Detectada',
          `Foi registrado um pico de ${picoMedido.toFixed(2)}g durante a assinatura, acima do limite de ${LIMITE_G.toFixed(1)}g. ` +
            'Apoie o aparelho, mantenha-o estável e assine novamente.'
        );
        return;
      }
    }

    setSalvando(true);
    const resultado = await salvarAuditoria({
      latitude: localizacao.latitude,
      longitude: localizacao.longitude,
      precisao: localizacao.accuracy,
      imagemUri: imagemEvidencia,
      produtorNome: contatoSelecionado.name,
      produtorTelefone: contatoSelecionado.phoneNumbers?.[0]?.number ?? null,
      picoAceleracao: picoMedido,
    });
    setSalvando(false);

    if (!resultado.sucesso) {
      Alert.alert(
        'Falha ao gravar',
        'A auditoria não pôde ser salva no armazenamento do aparelho. Libere espaço e tente de novo.'
      );
      return;
    }

    Alert.alert(
      'Auditoria assinada',
      'Relatório de visita técnica gravado no histórico local do aparelho.',
      [
        { text: 'Nova auditoria', onPress: limparFormulario },
        {
          text: 'Ver histórico',
          onPress: () => {
            limparFormulario();
            navigation.navigate('Historico');
          },
        },
      ]
    );
  }

  const estavel = aceleracaoAtual <= LIMITE_G;

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={globalStyles.conteudo}>
      <View style={paisagem ? globalStyles.grade : null}>
        {/* 1. GPS */}
        <View style={estiloCard}>
          <View style={globalStyles.cabecalhoCard}>
            <Text style={globalStyles.tituloSecao}>1. Georreferenciamento do lote</Text>
            <IndicadorPrecisao precisao={localizacao ? localizacao.accuracy : null} />
          </View>

          <BotaoCustomizado
            titulo={localizacao ? 'Atualizar localização' : 'Marcar localização atual'}
            onPress={capturarCoordenadasGPS}
            carregando={carregandoGps}
            tipo="primary"
          />

          {localizacao && (
            <View style={{ marginTop: 8 }}>
              <Text style={globalStyles.dado}>Latitude: {localizacao.latitude.toFixed(6)}</Text>
              <Text style={globalStyles.dado}>Longitude: {localizacao.longitude.toFixed(6)}</Text>
              <Text style={globalStyles.textoInformativo}>
                Raio de erro estimado: {localizacao.accuracy?.toFixed(1)} m
              </Text>
            </View>
          )}

          {avisoGps && (
            <View style={globalStyles.aviso}>
              <Text style={globalStyles.avisoTexto}>{avisoGps}</Text>
            </View>
          )}
        </View>

        {/* 2. Camera */}
        <View style={estiloCard}>
          <Text style={globalStyles.tituloSecao}>2. Evidência de qualidade dos grãos</Text>
          <BotaoCustomizado
            titulo={imagemEvidencia ? 'Refazer foto' : 'Acionar câmera de campo'}
            onPress={capturarFotoEvidencia}
            tipo="warning"
          />

          {imagemEvidencia && (
            <Image source={{ uri: imagemEvidencia }} style={globalStyles.imagePreview} />
          )}

          {avisoCamera && (
            <View style={globalStyles.aviso}>
              <Text style={globalStyles.avisoTexto}>{avisoCamera}</Text>
            </View>
          )}
        </View>

        {/* 3. Contatos */}
        <View style={estiloCard}>
          <Text style={globalStyles.tituloSecao}>3. Produtor responsável</Text>
          <BotaoCustomizado
            titulo="Buscar produtores na agenda"
            onPress={carregarContatosProdutores}
            carregando={carregandoContatos}
            tipo="primary"
          />

          {contatoSelecionado && (
            <Text style={[globalStyles.dado, { color: cores.primaria, fontWeight: '700' }]}>
              Vinculado a {contatoSelecionado.name}
            </Text>
          )}

          {listaContatos.map((item) => {
            const selecionado = contatoSelecionado?.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[globalStyles.itemContato, selecionado && globalStyles.itemContatoSelecionado]}
                onPress={() => setContatoSelecionado(item)}
                activeOpacity={0.7}
              >
                <Text style={globalStyles.nomeContato}>{item.name}</Text>
                {item.phoneNumbers?.length > 0 && (
                  <Text style={globalStyles.telefoneContato}>{item.phoneNumbers[0].number}</Text>
                )}
              </TouchableOpacity>
            );
          })}

          {avisoContatos && (
            <View style={globalStyles.aviso}>
              <Text style={globalStyles.avisoTexto}>{avisoContatos}</Text>
            </View>
          )}
        </View>

        {/* 4. Telemetria */}
        <View style={estiloCard}>
          <View style={globalStyles.cabecalhoCard}>
            <Text style={globalStyles.tituloSecao}>4. Estabilidade do aparelho</Text>
            {sensorDisponivel && (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: estavel ? cores.precisaoAlta : cores.perigo,
                }}
              >
                {aceleracaoAtual.toFixed(2)} g
              </Text>
            )}
          </View>

          <Text style={globalStyles.textoInformativo}>
            {sensorDisponivel
              ? `A assinatura lê o acelerômetro por ${JANELA_ANALISE_MS / 1000}s e bloqueia o envio se o pico passar de ${LIMITE_G.toFixed(1)}g.`
              : 'Sensor indisponível neste aparelho.'}
          </Text>

          {avisoSensor && (
            <View style={globalStyles.aviso}>
              <Text style={globalStyles.avisoTexto}>{avisoSensor}</Text>
            </View>
          )}
        </View>
      </View>

      <BotaoCustomizado
        titulo={verificandoEstabilidade ? 'Medindo estabilidade...' : 'Finalizar e assinar auditoria'}
        onPress={finalizarRelatorioAuditoria}
        tipo="success"
        carregando={verificandoEstabilidade || salvando}
      />

      <BotaoCustomizado
        titulo="Ver histórico de auditorias"
        onPress={() => navigation.navigate('Historico')}
        tipo="ghost"
      />
    </ScrollView>
  );
}
