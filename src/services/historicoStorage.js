import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * RF01 - Historico local e persistencia.
 * Todo o historico e gravado como um unico JSON no armazenamento do dispositivo,
 * o que permite consultar auditorias passadas totalmente offline.
 */
const CHAVE_HISTORICO = '@auditoria_agricola:historico';

export async function listarAuditorias() {
  try {
    const json = await AsyncStorage.getItem(CHAVE_HISTORICO);
    if (!json) return [];
    const lista = JSON.parse(json);
    return Array.isArray(lista) ? lista : [];
  } catch (erro) {
    console.warn('Falha ao ler o histórico local:', erro);
    return [];
  }
}

export async function salvarAuditoria(registro) {
  try {
    const historicoAtual = await listarAuditorias();
    const novoRegistro = {
      id: `${Date.now()}`,
      criadoEm: new Date().toISOString(),
      ...registro,
    };
    const atualizado = [novoRegistro, ...historicoAtual];
    await AsyncStorage.setItem(CHAVE_HISTORICO, JSON.stringify(atualizado));
    return { sucesso: true, registro: novoRegistro };
  } catch (erro) {
    console.warn('Falha ao gravar o histórico local:', erro);
    return { sucesso: false, erro };
  }
}

export async function removerAuditoria(id) {
  try {
    const historicoAtual = await listarAuditorias();
    const atualizado = historicoAtual.filter((item) => item.id !== id);
    await AsyncStorage.setItem(CHAVE_HISTORICO, JSON.stringify(atualizado));
    return atualizado;
  } catch (erro) {
    console.warn('Falha ao remover registro:', erro);
    return null;
  }
}

export async function limparHistorico() {
  try {
    await AsyncStorage.removeItem(CHAVE_HISTORICO);
    return true;
  } catch (erro) {
    console.warn('Falha ao limpar o histórico:', erro);
    return false;
  }
}
