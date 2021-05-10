import * as chalk from "chalk"

export const rotateMatrix = (matrix: number[][], amount: number = 1): number[][] => {
    let rotateArr = matrix.map((a) => a.slice());
    const n = rotateArr.length;
    const x = Math.floor(n / 2);
    const y = n - 1;
    for (let _ = 0; _ < amount; _++) {
        for (let i = 0; i < x; i++) {
            for (let j = i; j < y - i; j++) {
                const k = rotateArr[i][j];
                rotateArr[i][j] = rotateArr[y - j][i];
                rotateArr[y - j][i] = rotateArr[y - i][y - j];
                rotateArr[y - i][y - j] = rotateArr[j][y - i];
                rotateArr[j][y - i] = k;
            }
        }
    }
    return rotateArr;
}

export const deepArrayCopy = (array: any[]): any[] => JSON.parse(JSON.stringify(array));

export const random = (min: number, max: number): number => Math.floor(Math.random() * (max - min) + min);

export const gridify = (rows: any[][]) => {
    rows.forEach(row => {
        let line: string = '_' + row.reduce((prev: string, curr: number): string => {
            return prev + '_' + curr
        });
        while (line.match(/_[0-9]/)) {
            line = line.replace('_0', chalk.bgHex('#333333').gray(' 0 '))
            line = line.replace('_1', chalk.bgGreen(' 1 '))
            line = line.replace('_2', chalk.bgCyan(' 2 '))
            line = line.replace('_3', chalk.bgRed(' 3 '))
            line = line.replace('_4', chalk.bgYellow(' 4 '))
            line = line.replace('_5', chalk.bgMagenta(' 5 '))
            line = line.replace('_6', chalk.bgBlue(' 6 '))
            line = line.replace('_9', chalk.white(' 9 '))
        }
        console.log('  ' + line)
    })
    console.log()
}