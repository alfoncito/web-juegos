import { promises as fsp } from 'node:fs';

fsp
	.writeFile('mi-prueba.txt', 'contenido')
 	.then(() => {
		return fsp.rename('mi-prueba.txt', 'nuevo-nombre.txt');
 	})
 	.then(() => console.log('listo'));
