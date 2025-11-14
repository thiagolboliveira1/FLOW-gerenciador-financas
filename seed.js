// =============================
// SEED COMPLETO (1 + 3)
// FamÍlia Oliveira – FINAL
// =============================

export const contasIniciais = [
  {
    "id": "inc_thiago",
    "type": "income",
    "title": "Salário Thiago (média)",
    "subtitle": "Renda (comissão/produção)",
    "owner": "Thiago",
    "value": 5500,
    "date": "2025-01-01",
    "tags": ["salário","média"]
  },
  {
    "id": "inc_adriele",
    "type": "income",
    "title": "Salário Adriele (média)",
    "subtitle": "Renda",
    "owner": "Adriele",
    "value": 600,
    "date": "2025-01-01",
    "tags": ["salário"]
  },

  {
    "id": "fix_aluguel",
    "type": "fixed",
    "title": "Aluguel",
    "subtitle": "Despesa Fixa",
    "owner": "Casa",
    "value": 1600,
    "tags": ["moradia"]
  },
  {
    "id": "fix_luz",
    "type": "fixed",
    "title": "Luz",
    "subtitle": "Despesa variável mês a mês",
    "owner": "Casa",
    "value": 278.96,
    "tags": ["luz"]
  },

  {
    "id": "fix_agua2",
    "type": "fixed",
    "title": "Água – última conta",
    "subtitle": "Despesa variável",
    "owner": "Casa",
    "value": 253.88,
    "date": "2025-11-12",
    "tags": ["agua"]
  },

  {
    "id": "fix_mercado",
    "type": "variable",
    "title": "Mercado (estimado)",
    "subtitle": "Despesa Mensal",
    "owner": "Casa",
    "value": 500,
    "tags": ["mercado"]
  },

  {
    "id": "fix_internet",
    "type": "fixed",
    "title": "Internet / Telefone",
    "subtitle": "Despesa Fixa",
    "owner": "Casa",
    "value": 128.99,
    "tags": ["internet"]
  },

  {
    "id": "fix_carro",
    "type": "fixed",
    "title": "Carro – parcela",
    "subtitle": "22/48 pagas",
    "owner": "Thiago",
    "value": 767.32,
    "date": "2025-11-15",
    "tags": ["carro","financiamento"]
  },

  {
    "id": "fix_nubank",
    "type": "variable",
    "title": "Cartão Nubank",
    "subtitle": "Fatura",
    "owner": "Casa",
    "value": 232.78,
    "date": "2025-11-20",
    "tags": ["nubank","cartão"]
  },

  {
    "id": "fix_ailos",
    "type": "fixed",
    "title": "Ailos – acordo 24x",
    "subtitle": "3ª parcela",
    "owner": "Thiago",
    "value": 196.63,
    "date": "2025-12-20",
    "tags": ["ailos","acordo"]
  },

  {
    "id": "fix_tim",
    "type": "fixed",
    "title": "Internet TIM móvel",
    "subtitle": "Fatura",
    "owner": "Casa",
    "value": 48.99,
    "tags": ["tim","internet móvel"]
  },

  {
    "id": "fix_sofa",
    "type": "fixed",
    "title": "Cartão Gabriel – Sofá",
    "subtitle": "Parcelamento",
    "owner": "Gabriel",
    "value": 250,
    "tags": ["sofa"]
  },

  {
    "id": "var_lazer",
    "type": "variable",
    "title": "Lazer",
    "subtitle": "Despesa variável",
    "owner": "Família",
    "value": 150,
    "tags": ["lazer"]
  },

  {
    "id": "var_farmacia",
    "type": "variable",
    "title": "Farmácia",
    "subtitle": "Despesa variável",
    "owner": "Família",
    "value": 150,
    "tags": ["farmácia"]
  },

  {
    "id": "var_gasolina",
    "type": "variable",
    "title": "Gasolina",
    "subtitle": "Despesa variável",
    "owner": "Thiago",
    "value": 250,
    "tags": ["gasolina"]
  },

  {
    "id": "var_jeitto",
    "type": "variable",
    "title": "Empréstimo Jeitto",
    "subtitle": "Parcela",
    "owner": "Thiago",
    "value": 221.10,
    "date": "2025-11-10",
    "tags": ["jeitto"]
  },

  {
    "id": "var_w",
    "type": "variable",
    "title": "Empréstimo W",
    "subtitle": "2x",
    "owner": "Thiago",
    "value": 300,
    "tags": ["emprestimo W"]
  },

  {
    "id": "var_mei",
    "type": "variable",
    "title": "MEI – atrasado",
    "subtitle": "Regularizar",
    "owner": "Thiago",
    "value": 100,
    "tags": ["mei"]
  },

  {
    "id": "debt_andrey",
    "type": "goal",
    "title": "Pagar dívida Andrey",
    "subtitle": "Pode parcelar",
    "owner": "Thiago",
    "value": 3000,
    "target": 3000,
    "progress": 0,
    "tags": ["dívida"]
  },

  {
    "id": "debt_gabriel",
    "type": "goal",
    "title": "Pagar dívida Gabriel",
    "subtitle": "Pode parcelar",
    "owner": "Thiago",
    "value": 2000,
    "target": 2000,
    "progress": 0,
    "tags": ["dívida"]
  },

  {
    "id": "meta_claro",
    "type": "goal",
    "title": "Limpar nome – Claro",
    "subtitle": "Acordo possível",
    "owner": "Thiago",
    "value": 325.52,
    "target": 325.52,
    "progress": 0,
    "tags": ["serasa","claro"]
  },

  {
    "id": "meta_shopee",
    "type": "goal",
    "title": "Limpar nome – Shopee",
    "subtitle": "Dívida",
    "owner": "Thiago",
    "value": 173.59,
    "target": 173.59,
    "progress": 0,
    "tags": ["serasa","shopee"]
  },

  {
    "id": "meta_adriele",
    "type": "goal",
    "title": "Limpar nome – Adriele",
    "subtitle": "Pode parcelar",
    "owner": "Adriele",
    "value": 3000,
    "target": 3000,
    "progress": 0,
    "tags": ["serasa"]
  },

  {
    "id": "cofrinho_emergencia",
    "type": "cofrinho",
    "title": "Poupança Emergencial",
    "subtitle": "Meta",
    "owner": "Família",
    "value": 0,
    "target": 10000,
    "progress": 0,
    "tags": ["poupança"]
  },

  {
    "id": "cofrinho_13",
    "type": "cofrinho",
    "title": "13º do Thiago",
    "subtitle": "Reserva anual",
    "owner": "Thiago",
    "value": 0,
    "target": 5500,
    "progress": 0,
    "tags": ["13"]
  },

  {
    "id": "manutencao_carro",
    "type": "goal",
    "title": "Manutenção preventiva carro",
    "subtitle": "Oficina",
    "owner": "Thiago",
    "value": 2300,
    "target": 2300,
    "progress": 0,
    "tags": ["carro","manutencao"]
  },

  {
    "id": "dpvat",
    "type": "variable",
    "title": "DPVAT",
    "subtitle": "Seguro obrigatório",
    "owner": "Thiago",
    "value": 94.61,
    "date": "2025-10-31",
    "tags": ["dpvat"]
  },

  {
    "id": "multa",
    "type": "variable",
    "title": "Multa + DPVAT total",
    "subtitle": "Pagar juntos",
    "owner": "Thiago",
    "value": 232.50,
    "tags": ["multa"]
  }
];
