console.log("app.js loaded");


 //  COMMON FUNCTIONS


function fatigueLife(et, Ebit) {

    if (et <= 0 || Ebit <= 0) {
        throw new Error("et and Ebit must be greater than zero.");
    }

    return (
        2.21e-4 *
        Math.pow(1 / et, 3.89) *
        Math.pow(1 / Ebit, 0.854)
    );
}

function ruttingLife(ev) {

    if (ev <= 0) {
        throw new Error("ev must be greater than zero.");
    }

    return (
        4.165e-5 *
        Math.pow(1 / ev, 4.533)
    );
}

//HELPER FUNCTIONS


function contactRadius(P, p) {

    if (P <= 0 || p <= 0) {
        throw new Error("Load and pressure must be positive.");
    }

    return Math.sqrt(P / (Math.PI * p));
}

function modulusRatio(E1, E2) {

    if (E2 === 0) {
        throw new Error("E2 cannot be zero.");
    }

    return E1 / E2;
}

// BESSEL FUNCTIONS


function J0(x) {

    if (Math.abs(x) < 1e-8) {
        return 1;
    }

    let sum = 1;
    let term = 1;

    for (let k = 1; k <= 20; k++) {

        term *= -(x * x / 4) / (k * k);
        sum += term;
    }

    return sum;
}

function J1(x) {

    let sum = x / 2;
    let term = x / 2;

    for (let k = 1; k <= 20; k++) {

        term *= -(x * x / 4) / (k * (k + 1));
        sum += term;
    }

    return sum;
}

   //NUMERICAL INTEGRATION


function integrate(func, a, b, n) {

    let h = (b - a) / n;
    let sum = 0;

    for (let i = 0; i < n; i++) {

        let x1 = a + i * h;
        let x2 = x1 + h;

        sum += (func(x1) + func(x2)) * h / 2;
    }

    return sum;
}


   //GAUSSIAN ELIMINATION


function gaussianSolve(A, b) {

    let n = b.length;

    for (let i = 0; i < n; i++) {

        let maxRow = i;

        for (let k = i + 1; k < n; k++) {

            if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
                maxRow = k;
            }
        }

        [A[i], A[maxRow]] = [A[maxRow], A[i]];
        [b[i], b[maxRow]] = [b[maxRow], b[i]];

        for (let k = i + 1; k < n; k++) {

            let factor = A[k][i] / A[i][i];

            for (let j = i; j < n; j++) {
                A[k][j] -= factor * A[i][j];
            }

            b[k] -= factor * b[i];
        }
    }

    let x = new Array(n);

    for (let i = n - 1; i >= 0; i--) {

        x[i] = b[i];

        for (let j = i + 1; j < n; j++) {
            x[i] -= A[i][j] * x[j];
        }

        x[i] /= A[i][i];
    }

    return x;
}


  // BURMISTER ANALYSIS


function burmisterAnalysis(
    P,
    p,
    h,
    E1,
    E2,
    nu1,
    nu2
) {

    let a = contactRadius(P, p);

    function integrand(m) {

        return (
            Math.exp(-m * 0.01) *
            J0(m * a)
        );
    }

    let stress = integrate(
        integrand,
        0,
        100,
        5000
    );

    return {
        sigmaZ: stress,
        ev: stress / E2,
        et: stress / E1
    };
}


  // FATiGUE/RUTTING CALCULATOR


function calculate() {

    try {

        let et = parseFloat(
            document.getElementById("et").value
        );

        let ev = parseFloat(
            document.getElementById("ev").value
        );

        let Ebit = parseFloat(
            document.getElementById("ebit").value
        );

        let traffic = parseFloat(
            document.getElementById("traffic").value
        );

        if (
            isNaN(et) ||
            isNaN(ev) ||
            isNaN(Ebit) ||
            isNaN(traffic)
        ) {
            throw new Error("Please enter all values.");
        }

        let Nf = fatigueLife(et, Ebit);
        let Nr = ruttingLife(ev);

        let fatigueSafe = traffic <= Nf;
        let ruttingSafe = traffic <= Nr;

        document.getElementById("result").innerHTML = `
            <h3>Results</h3>

            Fatigue Life (Nf):
            ${Nf.toExponential(3)}

            <br><br>

            Rutting Life (Nr):
            ${Nr.toExponential(3)}

            <br><br>

            Fatigue Check:
            <b>${fatigueSafe ? "SAFE" : "UNSAFE"}</b>

            <br><br>

            Rutting Check:
            <b>${ruttingSafe ? "SAFE" : "UNSAFE"}</b>
        `;

    } catch (error) {

        document.getElementById("result").innerHTML =
            "Error: " + error.message;

        console.error(error);
    }
}


  // LIFE CALCULATOR


function calculateLife() {

    try {

        let P = parseFloat(document.getElementById("load").value);
        let p = parseFloat(document.getElementById("pressure").value);
        let h = parseFloat(document.getElementById("thickness").value);
        let E1 = parseFloat(document.getElementById("E1").value);
        let E2 = parseFloat(document.getElementById("E2").value);
        let nu1 = parseFloat(document.getElementById("nu1").value);
        let nu2 = parseFloat(document.getElementById("nu2").value);
        let Ebit = parseFloat(document.getElementById("ebit").value);
        let traffic = parseFloat(document.getElementById("traffic").value);

        if (
            isNaN(P) ||
            isNaN(p) ||
            isNaN(h) ||
            isNaN(E1) ||
            isNaN(E2) ||
            isNaN(nu1) ||
            isNaN(nu2) ||
            isNaN(Ebit) ||
            isNaN(traffic)
        ) {
            throw new Error("Please enter all input values.");
        }

        let a = contactRadius(P, p);

        let m = modulusRatio(E1, E2);

        let result = burmisterAnalysis(
            P,
            p,
            h,
            E1,
            E2,
            nu1,
            nu2
        );

        let sigmaZ = result.sigmaZ;
        let ev = result.ev;
        let et = result.et;

        let Nf = fatigueLife(et, Ebit);
        let Nr = ruttingLife(ev);

        let fatigueSafe = traffic <= Nf;
        let ruttingSafe = traffic <= Nr;

        document.getElementById("result").innerHTML = `
            <h3>Layer Analysis Results</h3>

            Contact Radius:
            ${a.toFixed(3)}

            <br><br>

            Modulus Ratio:
            ${m.toFixed(3)}

            <br><br>

            Vertical Stress:
            ${sigmaZ.toExponential(3)}

            <br><br>

            Vertical Strain:
            ${ev.toExponential(3)}

            <br><br>

            Tensile Strain:
            ${et.toExponential(3)}

            <br><br>

            Fatigue Life:
            ${Nf.toExponential(3)}

            <br><br>

            Rutting Life:
            ${Nr.toExponential(3)}

            <br><br>

            Fatigue Check:
            <b>${fatigueSafe ? "SAFE" : "UNSAFE"}</b>

            <br><br>

            Rutting Check:
            <b>${ruttingSafe ? "SAFE" : "UNSAFE"}</b>
        `;

    } catch (error) {

        document.getElementById("result").innerHTML =
            "Error: " + error.message;

        console.error(error);
    }
}