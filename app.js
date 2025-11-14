// SEED FINAL 1+3 - Família Oliveira (com imagens keys)

export const contasIniciais = [

  // RENDAS
  {"id":"inc_thiago","type":"income","title":"Salário Thiago (média)","owner":"Thiago","value":5500,"imgKey":"salary"},
  {"id":"inc_adriele","type":"income","title":"Salário Adriele (média)","owner":"Adriele","value":600,"imgKey":"salary"},

  // FIXAS
  {"id":"fix_aluguel","type":"fixed","title":"Aluguel","owner":"Casa","value":1600,"imgKey":"home"},
  {"id":"fix_luz","type":"fixed","title":"Luz","owner":"Casa","value":278.96,"imgKey":"light"},
  {"id":"fix_agua","type":"fixed","title":"Água (última)","owner":"Casa","value":253.88,"imgKey":"water","date":"2025-11-12"},
  {"id":"fix_mercado","type":"variable","title":"Mercado","owner":"Casa","value":500,"imgKey":"market"},
  {"id":"fix_internet","type":"fixed","title":"Internet/Telefone","owner":"Casa","value":128.99,"imgKey":"internet"},
  {"id":"fix_carro","type":"fixed","title":"Carro (parcela)","owner":"Thiago","value":767.32,"imgKey":"car"},
  {"id":"fix_nubank","type":"variable","title":"Cartão Nubank","owner":"Casa","value":232.78,"imgKey":"card"},
  {"id":"fix_ailos","type":"fixed","title":"Ailos (parcela)","owner":"Thiago","value":196.63,"imgKey":"loan"},
  {"id":"fix_tim","type":"fixed","title":"Internet TIM móvel","owner":"Casa","value":48.99,"imgKey":"phone"},
  {"id":"fix_sofa","type":"fixed","title":"Cartão Gabriel - Sofá","owner":"Gabriel","value":250,"imgKey":"sofa"},

  // VARIÁVEIS
  {"id":"var_lazer","type":"variable","title":"Lazer","owner":"Família","value":150,"imgKey":"entertainment"},
  {"id":"var_farmacia","type":"variable","title":"Farmácia","owner":"Família","value":150,"imgKey":"pharmacy"},
  {"id":"var_gasolina","type":"variable","title":"Gasolina","owner":"Thiago","value":250,"imgKey":"gas"},
  {"id":"var_jeitto","type":"variable","title":"Empréstimo Jeitto","owner":"Thiago","value":221.10,"imgKey":"loan"},
  {"id":"var_w","type":"variable","title":"Empréstimo W","owner":"Thiago","value":300,"imgKey":"loan"},
  {"id":"var_mei","type":"variable","title":"MEI - atrasado","owner":"Thiago","value":100,"imgKey":"briefcase"},

  // DÍVIDAS
  {"id":"debt_andrey","type":"goal","title":"Pagar dívida Andrey","owner":"Thiago","value":3000,"target":3000,"progress":0,"imgKey":"debt"},
  {"id":"debt_gabriel","type":"goal","title":"Pagar dívida Gabriel","owner":"Thiago","value":2000,"target":2000,"progress":0,"imgKey":"debt"},

  // LIBERAÇÃO DE NOME / SERASA
  {"id":"meta_claro","type":"goal","title":"Limpar nome - Claro","owner":"Thiago","value":325.52,"target":325.52,"progress":0,"imgKey":"serasa"},
  {"id":"meta_shopee","type":"goal","title":"Limpar nome - Shopee","owner":"Thiago","value":173.59,"target":173.59,"progress":0,"imgKey":"serasa"},
  {"id":"meta_adriele","type":"goal","title":"Limpar nome - Adriele","owner":"Adriele","value":3000,"target":3000,"progress":0,"imgKey":"serasa"},

  // COFRINHOS / METAS DE POUPANÇA
  {"id":"cofrinho_emergencia","type":"cofrinho","title":"Poupança Emergencial","owner":"Família","value":0,"target":10000,"progress":0,"imgKey":"piggy"},
  {"id":"cofrinho_13","type":"cofrinho","title":"13º do Thiago","owner":"Thiago","value":0,"target":5500,"progress":0,"imgKey":"calendar"},

  // MANUTENÇÃO / DPVAT / MULTA
  {"id":"manutencao_carro","type":"goal","title":"Manutenção preventiva - carro","owner":"Thiago","value":2300,"target":2300,"progress":0,"imgKey":"car"},
  {"id":"dpvat","type":"variable","title":"DPVAT","owner":"Thiago","value":94.61,"imgKey":"insurance"},
  {"id":"multa","type":"variable","title":"Multa + DPVAT","owner":"Thiago","value":232.50,"imgKey":"ticket"}
];
