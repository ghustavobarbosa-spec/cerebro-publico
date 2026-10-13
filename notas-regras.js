/* Regras de avaliação do 2º semestre de 2026 e o motor de cálculo da página notas.html.
   Aqui só entram regras públicas (planos de ensino e cronogramas). Nenhuma nota pessoal:
   as notas e as faltas ficam no navegador de quem usa a página (localStorage). */
(function (root) {
  'use strict';

  var LIMITE_RISCO = 5.0;   // "Em risco" quando a nota mínima no que falta passa disto
  var EPS = 1e-9;

  function num(v) { return typeof v === 'number' && isFinite(v); }
  function soma(a) { return a.reduce(function (s, x) { return s + x; }, 0); }
  function media(a) { return a.length ? soma(a) / a.length : null; }

  // ------------------------------------------------------------ construtores de regra

  // Média ponderada linear. campos: [{k, nome, data, peso, tipo}]
  function linear(def) {
    def.calc = function (v) {
      var w = 0, s = 0;
      def.campos.forEach(function (c) { w += c.peso; s += c.peso * v[c.k]; });
      return s / w;
    };
    def.faltam = function (v) {
      return def.campos.filter(function (c) { return !num(v[c.k]); }).map(function (c) { return c.k; });
    };
    def.atual = function (v) {
      var w = 0, s = 0;
      def.campos.forEach(function (c) { if (num(v[c.k])) { w += c.peso; s += c.peso * v[c.k]; } });
      return w ? s / w : null;
    };
    def.pesoFeito = function (v) {
      var w = 0, f = 0;
      def.campos.forEach(function (c) { w += c.peso; if (num(v[c.k])) f += c.peso; });
      return f / w;
    };
    def.atualRotulo = 'Média das notas lançadas';
    return def;
  }

  // ------------------------------------------------------------ disciplinas

  var D = [];

  D.push(linear({
    id: 'fab', cod: 'PMR3301', nome: 'Complementos de Fabricação Mecânica', curto: 'Fabricação',
    aprov: 5, freqMin: 0.70, estrita: false,
    aulas: 32, aulasComo: 'aulas 1–31 + P3; provas regulares contam, PSub e REC não',
    regra: 'MF = 0,25·P1 + 0,25·P2 + 0,25·P3 + 0,15·S + 0,10·A',
    regraTexto: 'Aprova com MF ≥ 5,0 e frequência ≥ 70%. Abaixo de 5,0, a REC fecha a média: MFF = (MF + REC)/2.',
    campos: [
      { k: 'P1', nome: 'P1', data: '2026-09-23', peso: 0.25, tipo: 'prova' },
      { k: 'P2', nome: 'P2', data: '2026-10-23', peso: 0.25, tipo: 'prova' },
      { k: 'P3', nome: 'P3', data: '2026-12-04', peso: 0.25, tipo: 'prova' },
      { k: 'S', nome: 'Seminários (S)', data: '2026-12-02', peso: 0.15, tipo: 'trabalho' },
      { k: 'A', nome: 'Atividades extraclasse (A)', data: null, peso: 0.10, tipo: 'trabalho' }
    ],
    sub: { k: 'PSub', nome: 'PSub', data: '2026-12-09', alvos: ['P1', 'P2', 'P3'], nota: 'Fechada: só com falta justificada. Substitui a prova perdida.' },
    rec: { k: 'REC', nome: 'REC', data: '2026-12-16', de: -Infinity, nota: 'MFF = (MF + REC)/2' },
    eventos: [['P1', '2026-09-23'], ['P2', '2026-10-23'], ['Seminário', '2026-11-25'], ['Seminário', '2026-11-27'],
      ['Seminário', '2026-12-02'], ['P3', '2026-12-04'], ['PSub', '2026-12-09'], ['REC', '2026-12-16']],
    confirmar: ['Quem tem direito à REC: o plano não diz a MF mínima para fazê-la.'],
    material: 'fabricacao/p1-pmr3301-guia-exercicios.html'
  }));

  // Sólidos II: NF = 0,8·MGP + 0,2·MAE + B; MGP = média geométrica das 3 melhores entre P1, P2, P3 e PSub
  (function () {
    var EX = []; for (var i = 1; i <= 10; i++) EX.push('E' + i);
    var PROVAS = ['P1', 'P2', 'P3'];
    function provasDe(v) { return PROVAS.concat(['PSub']).map(function (k) { return v[k]; }).filter(num); }
    function mgp(ps) {
      ps = ps.slice().sort(function (a, b) { return b - a; });
      var n = Math.min(3, ps.length);
      if (!n) return null;
      var p = 1; for (var j = 0; j < n; j++) p *= ps[j];
      return Math.pow(p, 1 / n);
    }
    D.push({
      id: 'sol', cod: 'PME3211', nome: 'Mecânica dos Sólidos II', curto: 'Sólidos II',
      aprov: 5, freqMin: 0.70, estrita: false,
      aulas: 30, aulasComo: 'aulas 1ª–30ª, com P1, P2 e P3; PSub não conta',
      regra: 'NF = 0,8·MGP + 0,2·MAE + B',
      regraTexto: 'MGP é a média geométrica das 3 melhores notas entre P1, P2, P3 e PSub. MAE é a média dos 10 exercícios em grupo. B é o bônus de participação (0 a 0,5).',
      campos: [
        { k: 'P1', nome: 'P1', data: '2026-09-14', tipo: 'prova' },
        { k: 'P2', nome: 'P2', data: '2026-10-26', tipo: 'prova' },
        { k: 'P3', nome: 'P3', data: '2026-11-30', tipo: 'prova' },
        { k: 'PSub', nome: 'PSub', data: '2026-12-07', tipo: 'prova', opcional: true, dica: 'entra entre as 3 melhores' }
      ],
      grade: { titulo: 'Exercícios em grupo (MAE)', chaves: EX, rotulo: function (i) { return '#' + (i < 9 ? '0' : '') + (i + 1); } },
      bonus: { k: 'B', nome: 'Bônus B (0 a 0,5)', max: 0.5 },
      eventos: [['P1', '2026-09-14'], ['P2', '2026-10-26'], ['P3', '2026-11-30'], ['PSub', '2026-12-07']],
      confirmar: ['A PSub é aberta a todos? O critério a conta entre as 3 melhores; o cálculo só a usa se você lançar a nota.'],
      material: 'mecanica-dos-solidos/index.html',
      calc: function (v) {
        var mae = media(EX.map(function (k) { return v[k]; }));
        return 0.8 * mgp(provasDe(v)) + 0.2 * mae + (num(v.B) ? v.B : 0);
      },
      faltam: function (v) {
        var falta = [];
        var feitas = PROVAS.filter(function (k) { return num(v[k]); });
        if (!(feitas.length === 3 || (num(v.PSub) && feitas.length === 2)))
          falta = PROVAS.filter(function (k) { return !num(v[k]); });
        return falta.concat(EX.filter(function (k) { return !num(v[k]); }));
      },
      atual: function (v) { return mgp(provasDe(v)); },
      atualRotulo: 'MGP das provas lançadas',
      nomeFalta: function (ks) {
        var ex = ks.filter(function (k) { return k.charAt(0) === 'E'; }).length;
        var pr = ks.filter(function (k) { return k.charAt(0) !== 'E'; });
        var out = pr.slice();
        if (ex) out.push(ex === 10 ? 'nos exercícios' : ex + (ex === 1 ? ' exercício' : ' exercícios'));
        return out;
      }
    });
  })();

  D.push(linear({
    id: 'est', cod: 'PRO3200', nome: 'Estatística', curto: 'Estatística',
    aprov: 5, freqMin: 0.70, estrita: false,
    aulas: 31, aulasComo: 'aulas 01–28 + P1, P2 e P3; a SUB não conta',
    regra: 'MF = (2·P1 + 3·P2 + 3·P3)/8',
    regraTexto: 'Aprova com MF ≥ 5,0 e frequência ≥ 70%. A SUB é fechada: só para quem perdeu uma prova, e entra no lugar dela.',
    campos: [
      { k: 'P1', nome: 'P1', data: '2026-09-16', peso: 2, tipo: 'prova' },
      { k: 'P2', nome: 'P2', data: '2026-10-26', peso: 3, tipo: 'prova' },
      { k: 'P3', nome: 'P3', data: '2026-12-02', peso: 3, tipo: 'prova' }
    ],
    sub: { k: 'SUB', nome: 'SUB', data: '2026-12-09', alvos: ['P1', 'P2', 'P3'], nota: 'Fechada: só para quem perdeu uma prova.' },
    eventos: [['P1', '2026-09-16'], ['P2', '2026-10-26'], ['P3', '2026-12-02'], ['SUB', '2026-12-09']],
    confirmar: [],
    material: 'estatistica/index.html'
  }));

  D.push(linear({
    id: 'flu', cod: 'PME3230', nome: 'Mecânica dos Fluidos I', curto: 'Fluidos I',
    aprov: 5, freqMin: 0.70, estrita: false,
    aulas: null, aulasComo: 'depende da turma de teoria (T01, T02 ou T03), além das aplicações',
    regra: 'MF = (3P + L)/4',
    regraTexto: 'P = (P1 + P2 + P3)/3 e L = (RQ + PEL)/2. A PSUB é para quem não fez uma das provas e entra no lugar dela.',
    campos: [
      { k: 'P1', nome: 'P1', data: '2026-09-17', peso: 0.25, tipo: 'prova' },
      { k: 'P2', nome: 'P2', data: '2026-10-27', peso: 0.25, tipo: 'prova' },
      { k: 'P3', nome: 'P3', data: '2026-12-03', peso: 0.25, tipo: 'prova' },
      { k: 'RQ', nome: 'Relatórios e quizzes (RQ)', data: null, peso: 0.125, tipo: 'trabalho' },
      { k: 'PEL', nome: 'Prova das experiências (PEL)', data: '2026-12-03', peso: 0.125, tipo: 'prova' }
    ],
    sub: { k: 'PSUB', nome: 'PSUB', data: '2026-12-10', alvos: ['P1', 'P2', 'P3'], nota: 'Só para quem não fez P1, P2 ou P3.' },
    eventos: [['P1', '2026-09-17'], ['P2', '2026-10-27'], ['P3 + PEL', '2026-12-03'], ['PSUB', '2026-12-10']],
    confirmar: ['Como relatórios e quizzes se juntam em RQ.', 'Total de aulas: depende da sua turma de teoria.']
  }));

  // Modelagem: M = min((10/11)P + (5/22)T ; (P+T)/2 ; (5/22)P + (10/11)T)
  (function () {
    var W1 = 0.5, W2 = 0.5;
    function P(v) {
      var w = 0, s = 0;
      if (num(v.P1)) { w += W1; s += W1 * v.P1; }
      if (num(v.P2)) { w += W2; s += W2 * v.P2; }
      return w ? s / w : null;
    }
    D.push({
      id: 'mod', cod: 'PME3380', nome: 'Modelagem de Sistemas Dinâmicos', curto: 'Modelagem',
      aprov: 5, freqMin: 0.70, estrita: false,
      aulas: null, aulasComo: 'o cronograma mistura módulos, palestra e apresentações',
      regra: 'M = mín{ (10/11)P + (5/22)T ; (P + T)/2 ; (5/22)P + (10/11)T }',
      regraTexto: 'P é a média das provas e T a nota do trabalho. Como o menor dos três termos vale, P e T precisam ir bem juntos: T < 3 reprova mesmo com P = 10.',
      campos: [
        { k: 'P1', nome: 'P1', data: '2026-10-02', tipo: 'prova' },
        { k: 'P2', nome: 'P2 (cumulativa)', data: '2026-11-17', tipo: 'prova' },
        { k: 'T', nome: 'Trabalho (T)', data: '2026-11-22', tipo: 'trabalho' },
        { k: 'PSUB', nome: 'PSUB', data: '2026-12-11', tipo: 'prova', opcional: true, foraDoCalculo: true, dica: 'fora do cálculo até confirmar a regra' }
      ],
      eventos: [['P1', '2026-10-02'], ['P2', '2026-11-17'], ['Entrega do trabalho', '2026-11-22'],
        ['Apresentações', '2026-11-24'], ['PSUB', '2026-12-11']],
      confirmar: ['Como P sai de P1 e P2: o cálculo usa média simples.', 'Se a PSUB entra e no lugar de quê.',
        'Total de aulas: o cronograma mistura módulos, palestra e apresentações.'],
      material: 'modelagem-de-sistemas-dinamicos/p1-pme3380-modelagem-de-sistemas-dinamicos.html',
      calc: function (v) {
        var p = P(v), t = v.T;
        return Math.min(10 / 11 * p + 5 / 22 * t, (p + t) / 2, 5 / 22 * p + 10 / 11 * t);
      },
      faltam: function (v) { return ['P1', 'P2', 'T'].filter(function (k) { return !num(v[k]); }); },
      atual: P,
      atualRotulo: 'P das provas lançadas'
    });
  })();

  // Elementos I: M = A^0,1 · (0,35·P1 + 0,65·P2)^0,9; A = média das atividades presenciais
  (function () {
    var AT = []; for (var i = 1; i <= 15; i++) AT.push('A' + i);
    function A(v) { return media(AT.map(function (k) { return v[k]; }).filter(num)); }
    D.push({
      id: 'ele', cod: 'PME3350', nome: 'Elementos de Máquinas I', curto: 'Elementos I',
      aprov: 5, freqMin: 0.70, estrita: true,
      aulas: 34, aulasComo: 'aulas 1ª–34ª, com P1 e P2; a Psub não conta',
      regra: 'M = A^0,1 · (0,35·P1 + 0,65·P2)^0,9',
      regraTexto: 'A é a média das atividades presenciais. Aprova com M ≥ 5,0 e frequência maior que 70%. Com 3,0 < M < 5,0, dá para fazer a Prec.',
      campos: [
        { k: 'P1', nome: 'P1', data: '2026-09-30', tipo: 'prova' },
        { k: 'P2', nome: 'P2', data: '2026-12-08', tipo: 'prova' }
      ],
      lista: { titulo: 'Atividades presenciais (A)', chaves: AT, rotulo: function (i) { return 'Atividade ' + (i + 1); } },
      sub: { k: 'Psub', nome: 'Psub', data: '2026-12-11', alvos: ['P1', 'P2'], nota: 'Fechada: substitui a prova perdida.' },
      rec: { k: 'Prec', nome: 'Prec', data: null, de: 3, nota: 'Só com 3,0 < M < 5,0. Média final = (M + Prec)/2 (a confirmar).' },
      eventos: [['P1', '2026-09-30'], ['P2', '2026-12-08'], ['Psub', '2026-12-11']],
      confirmar: ['Fórmula da média com Prec: saiu corrompida no PDF; o cálculo usa (M + Prec)/2.', 'Quantas atividades presenciais haverá.'],
      material: 'elementos-de-maquinas/p1-pme3350-elementos-de-maquinas.html',
      calc: function (v) {
        var a = A(v); if (a === null) a = v._A;
        return Math.pow(a, 0.1) * Math.pow(0.35 * v.P1 + 0.65 * v.P2, 0.9);
      },
      faltam: function (v) {
        var f = ['P1', 'P2'].filter(function (k) { return !num(v[k]); });
        if (A(v) === null) f.push('_A');
        return f;
      },
      atual: function (v) {
        var w = 0, s = 0;
        if (num(v.P1)) { w += 0.35; s += 0.35 * v.P1; }
        if (num(v.P2)) { w += 0.65; s += 0.65 * v.P2; }
        return w ? s / w : null;
      },
      atualRotulo: 'Provas lançadas (0,35·P1 + 0,65·P2)',
      nomeFalta: function (ks) { return ks.map(function (k) { return k === '_A' ? 'nas atividades' : k; }); }
    });
  })();

  D.push(linear({
    id: 'lab', cod: 'PEA3389', nome: 'Laboratório de Eletricidade Geral II', curto: 'Lab. Eletricidade',
    aprov: 5, freqMin: 0.70, estrita: false,
    aulas: 6, aulasComo: '6 experimentos da turma T03',
    regra: 'Média = média simples dos 6 relatórios',
    regraTexto: 'Cada relatório tem peso 1. Não há provas.',
    campos: [
      { k: 'R1', nome: 'Exp. 1 · Lâmpadas e iluminação', data: '2026-08-06', peso: 1, tipo: 'trabalho' },
      { k: 'R2', nome: 'Exp. 2 · Condutores e proteção', data: '2026-08-20', peso: 1, tipo: 'trabalho' },
      { k: 'R3', nome: 'Exp. 3 · Dispositivos de comando', data: '2026-09-03', peso: 1, tipo: 'trabalho' },
      { k: 'R4', nome: 'Exp. 4 · Energia, potência e FP', data: '2026-09-24', peso: 1, tipo: 'trabalho' },
      { k: 'R5', nome: 'Exp. 5 · Motores: ligações', data: '2026-10-08', peso: 1, tipo: 'trabalho' },
      { k: 'R6', nome: 'Exp. 6 · Motores: partida', data: '2026-10-22', peso: 1, tipo: 'trabalho' }
    ],
    eventos: [['Exp. 1', '2026-08-06'], ['Exp. 2', '2026-08-20'], ['Exp. 3', '2026-09-03'], ['Exp. 4', '2026-09-24'],
      ['Exp. 5', '2026-10-08'], ['Exp. 6', '2026-10-22']],
    confirmar: [],
    nomeFalta: function (ks) { return ks.length === 6 ? ['nos 6 relatórios'] : ks.map(function (k) { return 'Exp. ' + k.slice(1); }); }
  }));

  var POR_ID = {}; D.forEach(function (d) { POR_ID[d.id] = d; });

  // ------------------------------------------------------------ motor

  function hojeISO(h) {
    h = h || new Date();
    return h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
  }
  function diasAte(iso, hoje) {
    var p = iso.split('-'), q = (hoje || hojeISO()).split('-');
    return Math.round((new Date(+p[0], +p[1] - 1, +p[2]) - new Date(+q[0], +q[1] - 1, +q[2])) / 864e5);
  }

  // Valores efetivos: aplica a substitutiva sobre a prova escolhida, se ela estiver vazia
  function efetivos(d, notas) {
    var v = {};
    Object.keys(notas || {}).forEach(function (k) { if (num(notas[k])) v[k] = notas[k]; });
    if (d.campos.some(function (c) { return c.foraDoCalculo; }))
      d.campos.forEach(function (c) { if (c.foraDoCalculo) delete v[c.k]; });
    var usadaEm = null;
    if (d.sub && num(v[d.sub.k])) {
      var alvo = notas[d.sub.k + '_alvo'];
      if (alvo && d.sub.alvos.indexOf(alvo) >= 0 && !num(v[alvo])) { v[alvo] = v[d.sub.k]; usadaEm = alvo; }
    }
    if (d.sub) delete v[d.sub.k];
    return { v: v, subEm: usadaEm };
  }

  function preencher(v, ks, x) {
    var w = {}; Object.keys(v).forEach(function (k) { w[k] = v[k]; });
    ks.forEach(function (k) { w[k] = x; });
    return w;
  }

  // Menor x (0–10) que, posto em tudo o que falta, leva a média ao mínimo de aprovação
  function notaMinima(d, v, faltam) {
    var f = function (x) { return d.calc(preencher(v, faltam, x)); };
    if (f(10) < d.aprov - EPS) return Infinity;
    if (f(0) >= d.aprov - EPS) return 0;
    var lo = 0, hi = 10;
    for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (f(m) >= d.aprov - EPS) hi = m; else lo = m; }
    return hi;
  }

  function presenca(d, dados, hoje) {
    var total = dados.aulas && num(dados.aulas[d.id]) ? dados.aulas[d.id] : d.aulas;
    var faltas = soma((dados.faltas || []).filter(function (f) { return f.disc === d.id; })
      .map(function (f) { return num(f.n) && f.n > 0 ? f.n : 1; }));
    var r = { total: num(total) && total > 0 ? total : null, totalProprio: !!(dados.aulas && num(dados.aulas[d.id])),
      faltas: faltas, min: d.freqMin, estrita: d.estrita };
    if (r.total === null) { r.sit = 'semtotal'; return r; }
    var lim = r.total * (1 - d.freqMin);
    r.permitidas = d.estrita ? Math.ceil(lim - EPS) - 1 : Math.floor(lim + EPS);
    r.restam = r.permitidas - faltas;
    r.proj = (r.total - faltas) / r.total;
    r.sit = r.restam < 0 ? 'reprovado' : r.restam <= 1 ? 'atencao' : 'ok';
    return r;
  }

  function proxima(d, hoje) {
    hoje = hoje || hojeISO();
    var ev = d.eventos.filter(function (e) { return e[1] >= hoje; }).sort(function (a, b) { return a[1] < b[1] ? -1 : 1; })[0];
    return ev ? { nome: ev[0], data: ev[1], dias: diasAte(ev[1], hoje) } : null;
  }

  function avaliar(d, dados, hoje) {
    dados = dados || {};
    var notas = (dados.notas && dados.notas[d.id]) || {};
    var e = efetivos(d, notas), v = e.v;
    var faltam = d.faltam(v);
    var r = { d: d, v: v, subEm: e.subEm, faltam: faltam, completo: faltam.length === 0, motivos: [] };
    r.faltamNomes = d.nomeFalta ? d.nomeFalta(faltam) : faltam.map(function (k) {
      var c = d.campos.filter(function (c) { return c.k === k; })[0]; return c ? c.k : k;
    });
    r.atual = d.atual(v);
    r.pesoFeito = d.pesoFeito ? d.pesoFeito(v) : null;
    r.freq = presenca(d, dados, hoje);
    r.prox = proxima(d, hoje);
    var freqRuim = r.freq.sit === 'reprovado';

    if (r.completo) {
      r.final = d.calc(v);
      var passou = r.final >= d.aprov - EPS;
      if (!passou && d.rec && r.final > d.rec.de) {
        r.recNecessaria = 2 * d.aprov - r.final;
        if (num(notas[d.rec.k])) { r.finalRec = (r.final + notas[d.rec.k]) / 2; passou = r.finalRec >= d.aprov - EPS; }
      }
      if (passou && !freqRuim) {
        r.status = 'aprovado';
        if (r.freq.sit === 'semtotal') r.motivos.push('Confira a frequência: o total de aulas não está definido.');
      } else {
        r.status = 'risco';
        if (!passou) r.motivos.push(r.recNecessaria ? (d.rec.nome + ': precisa de ' + fmt(r.recNecessaria) + ' para fechar 5,0.')
          : 'Média final abaixo de ' + fmt(d.aprov) + '.');
      }
    } else {
      r.x = notaMinima(d, v, faltam);
      r.status = (r.x > LIMITE_RISCO + EPS || freqRuim) ? 'risco' : 'emdia';
      if (r.x === Infinity) r.motivos.push('Nem com 10 em tudo o que falta a média chega a ' + fmt(d.aprov) + '.');
      else if (r.x > LIMITE_RISCO + EPS) r.motivos.push('A nota mínima no que falta passa de ' + fmt(LIMITE_RISCO, 1) + '.');
    }
    if (freqRuim) r.motivos.push('Passou do limite de faltas.');
    else if (r.freq.sit === 'atencao') r.motivos.push(r.freq.restam === 0 ? 'Não pode faltar mais nenhuma aula.' : 'Só pode faltar mais 1 aula.');
    return r;
  }

  // Média final se tirar x em tudo o que falta (para o "e se")
  function simular(d, dados, x) {
    var notas = (dados.notas && dados.notas[d.id]) || {};
    var v = efetivos(d, notas).v;
    return d.calc(preencher(v, d.faltam(v), x));
  }

  function fmt(x, casas) {
    if (!num(x)) return '—';
    return x.toFixed(casas == null ? 2 : casas).replace('.', ',');
  }
  // Nota mínima arredondada para cima em centésimos
  function fmtMin(x) {
    if (x === Infinity) return '> 10';
    return fmt(Math.ceil(x * 100 - 1e-6) / 100);
  }

  var API = { DISCIPLINAS: D, POR_ID: POR_ID, LIMITE_RISCO: LIMITE_RISCO, avaliar: avaliar, simular: simular,
    presenca: presenca, proxima: proxima, diasAte: diasAte, hojeISO: hojeISO, fmt: fmt, fmtMin: fmtMin, num: num };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.NOTAS = API;
})(this);
