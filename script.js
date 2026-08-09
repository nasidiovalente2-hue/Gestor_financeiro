import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";


import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";



/* =====================================================
   FIREBASE
===================================================== */

const firebaseConfig = {

    apiKey:
        "AIzaSyAX28Lfio1v_ipvVXESeJZ2UeW13IpW5iU",

    authDomain:
        "gestaofinanceira-8a807.firebaseapp.com",

    projectId:
        "gestaofinanceira-8a807",

    storageBucket:
        "gestaofinanceira-8a807.firebasestorage.app",

    messagingSenderId:
        "799921290606",

    appId:
        "1:799921290606:web:b022de46a8716a92e6957f"

};


const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getFirestore(app);



/* =====================================================
   FUNÇÕES AUXILIARES
===================================================== */

function $(
    id
){

    return document.getElementById(id);

}


function moeda(
    valor,
    codigo = ""
){

    const numero =
        Number(valor || 0);


    const resultado =
        numero.toLocaleString(
            "pt-PT",
            {
                minimumFractionDigits:2,
                maximumFractionDigits:2
            }
        );


    if(codigo){

        return resultado + " " + codigo;

    }


    return resultado;

}


function escapar(
    texto
){

    return String(texto ?? "")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");

}


function mensagem(
    id,
    texto
){

    const elemento =
        $(id);


    if(!elemento){

        return;

    }


    elemento.textContent =
        texto;


    elemento.style.display =
        texto
        ?
        "block"
        :
        "none";

}


function hoje(){

    const data =
        new Date();


    const offset =
        data.getTimezoneOffset();


    const local =
        new Date(
            data.getTime()
            -
            offset * 60000
        );


    return local
        .toISOString()
        .slice(0,10);

}



/* =====================================================
   REFERÊNCIAS FIRESTORE
===================================================== */

function referenciaCarteiras(){

    return collection(
        db,
        "users",
        auth.currentUser.uid,
        "wallets"
    );

}


function referenciaMovimentos(){

    return collection(
        db,
        "users",
        auth.currentUser.uid,
        "transactions"
    );

}



/* =====================================================
   AUTENTICAÇÃO
===================================================== */

onAuthStateChanged(
    auth,
    async usuario => {

        if(usuario){

            if($("login")){

                $("login").style.display =
                    "none";

            }


            if($("app")){

                $("app").style.display =
                    "block";

            }


            if(
                $("dataMovimento")
                &&
                !$("dataMovimento").value
            ){

                $("dataMovimento").value =
                    hoje();

            }


            await carregarDados();

        }
        else{

            if($("login")){

                $("login").style.display =
                    "flex";

            }


            if($("app")){

                $("app").style.display =
                    "none";

            }

        }

    }
);



/* =====================================================
   CRIAR CONTA
===================================================== */

window.criarConta =
async function(){

    const email =
        $("email")
        ?.value
        .trim();


    const senha =
        $("password")
        ?.value;


    if(!email || !senha){

        mensagem(
            "loginMensagem",
            "Preencha o e-mail e a senha."
        );

        return;

    }


    if(senha.length < 6){

        mensagem(
            "loginMensagem",
            "A senha deve ter pelo menos 6 caracteres."
        );

        return;

    }


    try{

        await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );


        mensagem(
            "loginMensagem",
            "Conta criada com sucesso."
        );

    }
    catch(erro){

        console.error(erro);

        mensagem(
            "loginMensagem",
            traduzirErro(erro)
        );

    }

};



/* =====================================================
   ENTRAR
===================================================== */

window.entrar =
async function(){

    const email =
        $("email")
        ?.value
        .trim();


    const senha =
        $("password")
        ?.value;


    if(!email || !senha){

        mensagem(
            "loginMensagem",
            "Preencha o e-mail e a senha."
        );

        return;

    }


    try{

        await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

    }
    catch(erro){

        console.error(erro);

        mensagem(
            "loginMensagem",
            traduzirErro(erro)
        );

    }

};



/* =====================================================
   SAIR
===================================================== */

window.sair =
async function(){

    await signOut(auth);

};



/* =====================================================
   ERROS
===================================================== */

function traduzirErro(
    erro
){

    const codigo =
        erro?.code || "";


    if(
        codigo.includes(
            "email-already-in-use"
        )
    ){

        return "Este e-mail já está cadastrado.";

    }


    if(
        codigo.includes(
            "invalid-credential"
        )
    ){

        return "E-mail ou senha incorretos.";

    }


    if(
        codigo.includes(
            "invalid-email"
        )
    ){

        return "E-mail inválido.";

    }


    if(
        codigo.includes(
            "weak-password"
        )
    ){

        return "A senha deve ter pelo menos 6 caracteres.";

    }


    return "Ocorreu um erro. Verifique o Firebase.";

}



/* =====================================================
   NAVEGAÇÃO
===================================================== */

window.abrirCarteiras =
function(){

    window.location.href =
        "carteiras.html";

};


window.voltarDashboard =
function(){

    window.location.href =
        "index.html";

};



/* =====================================================
   OBTER CARTEIRAS
===================================================== */

async function obterCarteiras(){

    if(!auth.currentUser){

        return [];

    }


    const resultado =
        await getDocs(
            referenciaCarteiras()
        );


    return resultado.docs.map(
        documento => ({

            id:
                documento.id,

            ...documento.data()

        })
    );

}



/* =====================================================
   OBTER MOVIMENTAÇÕES
===================================================== */

async function obterMovimentos(){

    if(!auth.currentUser){

        return [];

    }


    const resultado =
        await getDocs(
            referenciaMovimentos()
        );


    const movimentos =
        resultado.docs.map(
            documento => ({

                id:
                    documento.id,

                ...documento.data()

            })
        );


    movimentos.sort(
        (a,b) =>
            String(b.data || "")
            .localeCompare(
                String(a.data || "")
            )
    );


    return movimentos;

}



/* =====================================================
   SALVAR CARTEIRA
===================================================== */

window.salvarCarteira =
async function(){

    if(!auth.currentUser){

        alert(
            "Faça login primeiro."
        );

        return;

    }


    const nome =
        $("nomeCarteira")
        ?.value
        .trim();


    const tipo =
        $("tipoCarteira")
        ?.value;


    const moedaCarteira =
        $("moedaCarteira")
        ?.value
        .trim()
        .toUpperCase();


    const identificador =
        $("identificadorCarteira")
        ?.value
        .trim();


    const observacao =
        $("observacaoCarteira")
        ?.value
        .trim();


    if(!nome){

        mensagem(
            "carteiraMensagem",
            "Digite o nome da carteira."
        );

        return;

    }


    if(!tipo){

        mensagem(
            "carteiraMensagem",
            "Selecione o tipo da carteira."
        );

        return;

    }


    if(!moedaCarteira){

        mensagem(
            "carteiraMensagem",
            "Digite a moeda da carteira."
        );

        return;

    }


    try{

        await addDoc(
            referenciaCarteiras(),
            {

                nome:
                    nome,

                tipo:
                    tipo,

                moeda:
                    moedaCarteira,

                identificador:
                    identificador,

                observacao:
                    observacao,

                criadoEm:
                    serverTimestamp()

            }
        );


        $("nomeCarteira").value =
            "";

        $("tipoCarteira").value =
            "";

        $("moedaCarteira").value =
            "";

        $("identificadorCarteira").value =
            "";

        $("observacaoCarteira").value =
            "";


        mensagem(
            "carteiraMensagem",
            "Carteira salva com sucesso!"
        );


        await carregarDados();

    }
    catch(erro){

        console.error(erro);

        mensagem(
            "carteiraMensagem",
            "Não foi possível guardar a carteira. Verifique as regras do Firestore."
        );

    }

};



/* =====================================================
   CARREGAR CARTEIRAS
===================================================== */

async function carregarCarteiras(){

    if(!auth.currentUser){

        return;

    }


    const lista =
        $("listaCarteiras");


    const select =
        $("carteiraMovimento");


    if(lista){

        lista.innerHTML =
            `<div class="empty">
                Carregando carteiras...
            </div>`;

    }


    if(select){

        select.innerHTML =
            `<option value="">
                Selecione uma carteira
            </option>`;

    }


    try{

        const carteiras =
            await obterCarteiras();


        const movimentos =
            await obterMovimentos();


        const saldos =
            {};


        movimentos.forEach(
            movimento => {

                const valor =
                    Number(
                        movimento.valor || 0
                    );


                if(
                    !saldos[
                        movimento.carteira
                    ]
                ){

                    saldos[
                        movimento.carteira
                    ] = 0;

                }


                if(
                    movimento.tipo ===
                    "ganho"
                ){

                    saldos[
                        movimento.carteira
                    ] += valor;

                }
                else{

                    saldos[
                        movimento.carteira
                    ] -= valor;

                }

            }
        );


        if($("totalCarteiras")){

            $("totalCarteiras")
                .textContent =
                carteiras.length;

        }


        if(lista){

            lista.innerHTML = "";

        }


        if(
            !carteiras.length
        ){

            if(lista){

                lista.innerHTML =
                    `<div class="empty">
                        Nenhuma carteira cadastrada.
                    </div>`;

            }

        }


        carteiras.forEach(
            carteira => {

                if(lista){

                    const div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        "wallet";


                    div.innerHTML = `

                        <div class="wallet-name">
                            💼
                            ${escapar(
                                carteira.nome
                            )}
                        </div>

                        <div class="wallet-info">
                            Tipo:
                            ${escapar(
                                carteira.tipo
                            )}
                        </div>

                        <div class="wallet-info">
                            Moeda:
                            ${escapar(
                                carteira.moeda
                            )}
                        </div>

                        <div class="wallet-balance blue">

                            Saldo:
                            ${moeda(
                                saldos[
                                    carteira.id
                                ] || 0,
                                carteira.moeda
                            )}

                        </div>

                        ${
                            carteira.identificador
                            ?
                            `

                            <div class="wallet-info">
                                Endereço / identificador:
                            </div>

                            <div class="wallet-id">
                                ${escapar(
                                    carteira.identificador
                                )}
                            </div>

                            `
                            :
                            ""
                        }

                        ${
                            carteira.observacao
                            ?
                            `

                            <div class="wallet-info">
                                Observação:
                                ${escapar(
                                    carteira.observacao
                                )}
                            </div>

                            `
                            :
                            ""
                        }

                        <div class="wallet-actions">

                            <button
                                class="btn-red"
                                onclick="excluirCarteira('${carteira.id}')">

                                Excluir

                            </button>

                        </div>

                    `;


                    lista.appendChild(
                        div
                    );

                }


                if(select){

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        carteira.id;


                    option.textContent =
                        carteira.nome
                        +
                        " ("
                        +
                        carteira.moeda
                        +
                        ")";


                    select.appendChild(
                        option
                    );

                }

            }
        );

    }
    catch(erro){

        console.error(erro);

        if(lista){

            lista.innerHTML =
                `<div class="empty">
                    Erro ao carregar carteiras.
                </div>`;

        }

    }

}



/* =====================================================
   EXCLUIR CARTEIRA
===================================================== */

window.excluirCarteira =
async function(id){

    if(!auth.currentUser){

        return;

    }


    const movimentos =
        await obterMovimentos();


    const possuiMovimentos =
        movimentos.some(
            movimento =>
                movimento.carteira === id
        );


    if(possuiMovimentos){

        alert(
            "Esta carteira possui movimentações. Apague primeiro essas movimentações."
        );

        return;

    }


    const confirmar =
        confirm(
            "Deseja realmente excluir esta carteira?"
        );


    if(!confirmar){

        return;

    }


    try{

        await deleteDoc(
            doc(
                db,
                "users",
                auth.currentUser.uid,
                "wallets",
                id
            )
        );


        await carregarDados();

    }
    catch(erro){

        console.error(erro);

        alert(
            "Não foi possível excluir a carteira."
        );

    }

};



/* =====================================================
   SALVAR MOVIMENTAÇÃO
===================================================== */

window.salvarMovimento =
async function(){

    if(!auth.currentUser){

        alert(
            "Faça login primeiro."
        );

        return;

    }


    const tipo =
        $("tipoMovimento")
        ?.value;


    const valor =
        Number(
            $("valorMovimento")
            ?.value
        );


    const carteira =
        $("carteiraMovimento")
        ?.value;


    const data =
        $("dataMovimento")
        ?.value;


    const descricao =
        $("descricaoMovimento")
        ?.value
        .trim();


    if(
        !valor ||
        valor <= 0
    ){

        mensagem(
            "movimentoMensagem",
            "Digite um valor válido."
        );

        return;

    }


    if(!carteira){

        mensagem(
            "movimentoMensagem",
            "Selecione uma carteira."
        );

        return;

    }


    if(!data){

        mensagem(
            "movimentoMensagem",
            "Selecione uma data."
        );

        return;

    }


    try{

        const carteiras =
            await obterCarteiras();


        const carteiraSelecionada =
            carteiras.find(
                item =>
                    item.id === carteira
            );


        if(!carteiraSelecionada){

            mensagem(
                "movimentoMensagem",
                "Carteira não encontrada."
            );

            return;

        }


        await addDoc(
            referenciaMovimentos(),
            {

                tipo:
                    tipo,

                valor:
                    valor,

                carteira:
                    carteira,

                moeda:
                    carteiraSelecionada.moeda,

                data:
                    data,

                descricao:
                    descricao,

                criadoEm:
                    serverTimestamp()

            }
        );


        $("valorMovimento").value =
            "";

        $("descricaoMovimento").value =
            "";


        mensagem(
            "movimentoMensagem",
            "Movimentação guardada com sucesso!"
        );


        await carregarDados();

    }
    catch(erro){

        console.error(erro);

        mensagem(
            "movimentoMensagem",
            "Não foi possível guardar a movimentação."
        );

    }

};



/* =====================================================
   EXCLUIR MOVIMENTAÇÃO
===================================================== */

window.excluirMovimento =
async function(id){

    const confirmar =
        confirm(
            "Deseja excluir esta movimentação?"
        );


    if(!confirmar){

        return;

    }


    try{

        await deleteDoc(
            doc(
                db,
                "users",
                auth.currentUser.uid,
                "transactions",
                id
            )
        );


        await carregarDados();

    }
    catch(erro){

        console.error(erro);

        alert(
            "Não foi possível excluir a movimentação."
        );

    }

};



/* =====================================================
   DASHBOARD
===================================================== */

async function carregarDashboard(){

    if(!auth.currentUser){

        return;

    }


    const carteiras =
        await obterCarteiras();


    const movimentos =
        await obterMovimentos();


    const carteiraPorId =
        {};


    carteiras.forEach(
        carteira => {

            carteiraPorId[
                carteira.id
            ] =
                carteira;

        }
    );


    let ganhos =
        0;


    let retiradas =
        0;


    const moedas =
        {};


    movimentos.forEach(
        movimento => {

            const valor =
                Number(
                    movimento.valor || 0
                );


            const codigo =
                movimento.moeda
                ||
                carteiraPorId[
                    movimento.carteira
                ]?.moeda
                ||
                "N/A";


            if(!moedas[codigo]){

                moedas[codigo] = {

                    ganhos:0,

                    retiradas:0

                };

            }


            if(
                movimento.tipo ===
                "ganho"
            ){

                ganhos += valor;

                moedas[codigo]
                    .ganhos += valor;

            }
            else{

                retiradas += valor;

                moedas[codigo]
                    .retiradas += valor;

            }

        }
    );


    const listaMoedas =
        Object.keys(
            moedas
        );


    if(
        listaMoedas.length === 1
    ){

        const codigo =
            listaMoedas[0];


        $("saldo").textContent =
            moeda(
                ganhos - retiradas,
                codigo
            );


        $("ganhos").textContent =
            moeda(
                ganhos,
                codigo
            );


        $("retiradas").textContent =
            moeda(
                retiradas,
                codigo
            );

    }
    else if(
        listaMoedas.length > 1
    ){

        $("saldo").textContent =
            "Várias moedas";


        $("ganhos").textContent =
            "Várias moedas";


        $("retiradas").textContent =
            "Várias moedas";

    }
    else{

        $("saldo").textContent =
            "0,00";


        $("ganhos").textContent =
            "0,00";


        $("retiradas").textContent =
            "0,00";

    }


    mostrarResumoMoedas(
        moedas
    );


    mostrarEvolucao(
        movimentos,
        carteiraPorId
    );

}



/* =====================================================
   RESUMO POR MOEDA
===================================================== */

function mostrarResumoMoedas(
    moedas
){

    const elemento =
        $("listaMoedas");


    if(!elemento){

        return;

    }


    elemento.innerHTML =
        "";


    const codigos =
        Object.keys(
            moedas
        );


    if(!codigos.length){

        elemento.innerHTML =
            `<div class="empty">
                Ainda não existem movimentações.
            </div>`;

        return;

    }


    codigos.sort();


    codigos.forEach(
        codigo => {

            const dados =
                moedas[codigo];


            const saldo =
                dados.ganhos
                -
                dados.retiradas;


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "transaction";


            div.innerHTML = `

                <div>

                    <b>
                        ${escapar(codigo)}
                    </b>

                    <br>

                    <span class="subtitle">

                        Ganhos:
                        ${moeda(
                            dados.ganhos
                        )}

                        ·

                        Retiradas:
                        ${moeda(
                            dados.retiradas
                        )}

                    </span>

                </div>


                <div class="blue">

                    <b>
                        ${moeda(
                            saldo
                        )}
                    </b>

                </div>

            `;


            elemento.appendChild(
                div
            );

        }
    );

}



/* =====================================================
   HISTÓRICO
===================================================== */

async function mostrarMovimentos(){

    const lista =
        $("listaMovimentos");


    if(!lista){

        return;

    }


    const carteiras =
        await obterCarteiras();


    const movimentos =
        await obterMovimentos();


    const mapa =
        {};


    carteiras.forEach(
        carteira => {

            mapa[
                carteira.id
            ] =
                carteira;

        }
    );


    lista.innerHTML =
        "";


    if(!movimentos.length){

        lista.innerHTML =
            `<div class="empty">
                Nenhuma movimentação registrada.
            </div>`;

        return;

    }


    movimentos.forEach(
        movimento => {

            const carteira =
                mapa[
                    movimento.carteira
                ];


            const ganho =
                movimento.tipo ===
                "ganho";


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "transaction";


            div.innerHTML = `

                <div>

                    <b>

                        ${escapar(
                            movimento.descricao
                            ||
                            (
                                ganho
                                ?
                                "Ganho"
                                :
                                "Retirada"
                            )
                        )}

                    </b>

                    <br>

                    <span class="subtitle">

                        ${escapar(
                            movimento.data
                        )}

                        ·

                        ${escapar(
                            carteira?.nome
                            ||
                            "Carteira removida"
                        )}

                        ·

                        ${escapar(
                            movimento.moeda
                            ||
                            carteira?.moeda
                            ||
                            ""
                        )}

                    </span>

                    <br><br>

                    <button
                        class="btn-red"
                        onclick="excluirMovimento('${movimento.id}')">

                        Excluir

                    </button>

                </div>


                <div
                    class="${ganho ? "green" : "red"}">

                    <b>

                        ${ganho ? "+" : "-"}

                        ${moeda(
                            movimento.valor,
                            movimento.moeda
                            ||
                            carteira?.moeda
                            ||
                            ""
                        )}

                    </b>

                </div>

            `;


            lista.appendChild(
                div
            );

        }
    );

}



/* =====================================================
   EVOLUÇÃO
===================================================== */

function mostrarEvolucao(
    movimentos,
    mapaCarteiras
){

    const elemento =
        $("evolucao");


    if(!elemento){

        return;

    }


    elemento.innerHTML =
        "";


    const dados =
        {};


    movimentos.forEach(
        movimento => {

            const mes =
                String(
                    movimento.data || ""
                ).slice(
                    0,
                    7
                );


            const codigo =
                movimento.moeda
                ||
                mapaCarteiras[
                    movimento.carteira
                ]?.moeda
                ||
                "N/A";


            const chave =
                mes
                +
                "|"
                +
                codigo;


            if(!dados[chave]){

                dados[chave] = {

                    mes:
                        mes,

                    moeda:
                        codigo,

                    ganhos:
                        0,

                    retiradas:
                        0

                };

            }


            const valor =
                Number(
                    movimento.valor || 0
                );


            if(
                movimento.tipo ===
                "ganho"
            ){

                dados[chave]
                    .ganhos += valor;

            }
            else{

                dados[chave]
                    .retiradas += valor;

            }

        }
    );


    const lista =
        Object.values(
            dados
        );


    lista.sort(
        (a,b) =>
            b.mes.localeCompare(
                a.mes
            )
    );


    if(!lista.length){

        elemento.innerHTML =
            `<div class="empty">
                Ainda não existem dados para mostrar.
            </div>`;

        return;

    }


    lista.forEach(
        dadosMes => {

            const saldo =
                dadosMes.ganhos
                -
                dadosMes.retiradas;


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "transaction";


            div.innerHTML = `

                <div>

                    <b>

                        ${escapar(
                            dadosMes.mes
                        )}

                        ·

                        ${escapar(
                            dadosMes.moeda
                        )}

                    </b>

                    <br>

                    <span class="subtitle">

                        Ganhos:
                        ${moeda(
                            dadosMes.ganhos
                        )}

                        ·

                        Retiradas:
                        ${moeda(
                            dadosMes.retiradas
                        )}

                    </span>

                </div>


                <div class="blue">

                    <b>

                        ${moeda(
                            saldo,
                            dadosMes.moeda
                        )}

                    </b>

                </div>

            `;


            elemento.appendChild(
                div
            );

        }
    );

}



/* =====================================================
   CARREGAR TUDO
===================================================== */

async function carregarDados(){

    await carregarCarteiras();

    await carregarDashboard();

    await mostrarMovimentos();

}



/* =====================================================
   DATA INICIAL
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if($("dataMovimento")){

            $("dataMovimento").value =
                hoje();

        }

    }
);
