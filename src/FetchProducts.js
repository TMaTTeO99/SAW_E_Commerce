
import { collection, deleteDoc, getDocs, addDoc, getDoc, query, where, doc, setDoc, updateDoc, arrayUnion} from "firebase/firestore"; 
import { getFirestore } from "firebase/firestore";
import { app } from './LoginModules/LoginConfig';
import {Key} from './index';
import CryptoJS from "crypto-js";


import levenshtein from 'js-levenshtein';


///////////////////////////////////////////////////////
import {Preview} from "./TempDataProduct";
//////////////temp

function correctInput(input, dictionary) {

	// Se l'input dell'utente è nel dizionario
	if (dictionary.includes(input)) {
	  return input;
	}  
	// Altrimenti, cerco la parola nel dizionario che è più "vicina" all'input dell'utente
	let closestWord = dictionary[0];
	let closestDistance = levenshtein(input, closestWord);
  
	for (let i = 1; i < dictionary.length; i++) {
	  const distance = levenshtein(input, dictionary[i]);
	  if (distance < closestDistance) {
		closestWord = dictionary[i];
		closestDistance = distance;
	  }
	}
	console.log("parola trovata: " + closestWord);
	return closestWord;
} 


export async function upload() {

	
	const db = getFirestore(app);
	try {
		/*Preview.prodotti.forEach(async (obj) => {
			const docRef = await addDoc(collection(db, "preview"), obj);
			console.log("Document written with ID: ", docRef.id);
		});*/
		const docRef = await addDoc(collection(db, "preview"), Preview);
		console.log("Document written with ID: ", docRef.id);
	} 
	catch (e) {
		console.error("Error adding document: ", e);
	}
}
function myCypherData(data) {

	const ciphertext = CryptoJS.AES.encrypt(data, Key).toString();

	console.log("data " + data + " ciphertext "+ ciphertext);
	return ciphertext;
}
function myDecipherData(data) {
	
	const bytes = CryptoJS.AES.decrypt(data, Key);
	const originalText = bytes.toString(CryptoJS.enc.Utf8);
	
	console.log("data " + data + " originalText "+ originalText);
	return originalText;
}
export async function uploadCards(card, flag) {

	
	const db = getFirestore(app);
	try {
		//qui prima di fare l up-load devo cifrare i dati

		const protectedCard = {
			numcard: myCypherData(card.numcard),
			scadenza: myCypherData(card.scadenza),
			code: myCypherData(card.code),
			user: myCypherData(card.user),
			proprietario: myCypherData(card.proprietario)
		}
		
		//se il documento non esiste lo creo da zero
		if(flag === 0) {
			const docRef = await setDoc(doc(db, "cards", card.user), {usercard : [protectedCard]});
			console.log("Document written");
		}
		else if(flag === 1) {//se il documento esiste aggiungo la carta
			const docRef = await updateDoc(doc(db, "cards", card.user), {
				usercard: arrayUnion(protectedCard)
			});
			console.log("Document uploaded");
		}
		return true;
	} 
	catch (e) {
		console.error("Error adding document: ", e);
		return false;
	}
}
export async function checkCreditCardOnDB(card) {
	
	var flag = 1; 
	const db = getFirestore(app);
	const docRef = doc(db, 'cards', card.user);
	const docSnap = await getDoc(docRef);

	if(!docSnap.exists()) return 0;//documento inesistente

	const tmpCard = {
		numcard: myCypherData(card.numcard),
		scadenza: myCypherData(card.scadenza),
		code: myCypherData(card.code),
		user: myCypherData(card.user),
		proprietario: myCypherData(card.proprietario)
	}


	docSnap.data().usercard.forEach((crd) => {

		if(card.numcard === myDecipherData(crd.numcard) && card.scadenza === myDecipherData(crd.scadenza)
			&& card.code === myDecipherData(crd.code) && card.user === myDecipherData(crd.user) && card.proprietario === myDecipherData(crd.proprietario)) 
		{ 
			flag = -1;//il ducmento esiste e la carta è contenuta
		}

	});
	
	//il ducumento esiste ma non ha la carta che l untente vuole inserire ora
	return flag;

}

export async function deleteAllCard(ID) {

	const db = getFirestore(app);
	return await deleteDoc(doc(db, "cards", ID))
	.then(result => result)
	.catch((err) => {
		console.log(err);
		return err;
	});


}

export async function getPreview(){
	
	const db = getFirestore(app);
	
	const snapshot = await getDocs(collection(db, "preview"))
	.then(r => {return r;})
	.catch((err) => {
		console.log(err);
		return null;
	});
	if(snapshot) {
		return snapshot.docs[0].data().prodotti;
	}
	return [];
	
}

export async function getDictionary() {

	const db = getFirestore(app);
	
	
	const snapshot = await getDocs(collection(db, "dizionario"))
	.then(r => {return r;})
	.catch((err) => {
		console.log(err);
		return null;
	});
	if(snapshot) {
		return snapshot.docs[0].data().payload;
	}
	return ["maglietta", "camicia", "pantaloni", "jeans", "giacca", "cappotto", "scarpe"];
		
}

async function checkGender(processedWords) {

	var tmp = -1;
	await getGender().then((genders) => {
		genders.forEach((gender) => {
			if(processedWords.findIndex(x => x === gender) > -1)tmp = processedWords.findIndex(x => x === gender);
		});
	})
	return tmp;
}
async function checkProduct(processedWords) {

	var tmp = -1;
	await getProductType().then((productArray) => {
		productArray.forEach((product) => {
			if(processedWords.findIndex(x => x === product) > -1)tmp = processedWords.findIndex(x => x === product);			
		});
	});
	return tmp;
}

async function getGender() {

	const db = getFirestore(app);
	
	try {
		const snapshot = await getDocs(collection(db, "gender"));
		//console.log(snapshot.docs[0].data().payload);
		return snapshot.docs[0].data().payload;
	}
	catch(e) {
		console.log(e);
		//in caso di errore ritono un dizionario fittizio
		return new ["uomo", "donna", "bambino"];
	}

}
export async function getProductType() {

	const db = getFirestore(app);
	
	try {
		const snapshot = await getDocs(collection(db, "product"));
		//console.log(snapshot.docs[0].data().payload);
		return snapshot.docs[0].data().payload;
	}
	catch(e) {
		console.log(e);
		//in caso di errore ritono un dizionario fittizio
		return new ["scarpe", "maglie", "pantaloni"];
	}

}

function doQueryProductGender(processedWords, db, product, gender){
	
	if(processedWords.length !== 0){
		return query(collection(db, product),
		where("genere", "==", gender), where("description", "array-contains-any", processedWords));	
	}

	return query(collection(db, product), where("genere", "==", gender));
}

async function getDataForProductGender(processedWords, product, gender, db) {
	
	var data = [];

	const querySnapshotMaglie = await getDocs(doQueryProductGender(processedWords, db, product, gender));
	
	querySnapshotMaglie.forEach((doc) => {
		data.push(doc.data());
	});	
	return data;
}


function doQueryProduct(processedWords, db, product){

	if(processedWords.length !== 0){
		return query(collection(db, product),where("description", "array-contains-any", processedWords));
	}

	return query(collection(db, product));

}

async function getDataProduct(processedWords, product, db) {


	var data = [];
	const querySnapshotMaglie = await getDocs(doQueryProduct(processedWords, db, product));

	querySnapshotMaglie.forEach((doc) => {
		data.push(doc.data());
	});	
	
	return data;

}


function doQuery(processedWords, db, product) {

	return query(collection(db, product),
	where("description", "array-contains-any", processedWords));		
}
async function getDataGenerics(processedWords, db) {

	
	var data = [];
	const querySnapshotScarpe = await getDocs(doQuery(processedWords, db, "scarpe"));
	const querySnapshotPantaloni = await getDocs( doQuery(processedWords, db, "pantaloni"));
	const querySnapshotMaglie = await getDocs( doQuery(processedWords, db, "maglie"));
	
	querySnapshotMaglie.forEach((doc) => {
		data.push(doc.data());
	});	
	querySnapshotPantaloni.forEach((doc) => {
		data.push(doc.data());
	});
	
	querySnapshotScarpe.forEach((doc) => {
		data.push(doc.data());
	});
	
	return data;
}

function doQueryGender(product, processedWords, gender, db){

	//se oltre al genere ho altri dati per fare la query
	if(processedWords.length !== 0) {
		return query(collection(db, product), 
		where("genere", "==", gender),
		where("description", "array-contains-any", processedWords));
	}

	//faccio la query con solo i dati che ho
	return query(collection(db, product), where("genere", "==", gender));
	
} 
async function getDataForGender(processedWords, gender, db){


	var data = [];
	const querySnapshotMaglie = await getDocs(doQueryGender("maglie", processedWords, gender, db));
	const querySnapshotPantaloni = await getDocs(doQueryGender("pantaloni", processedWords, gender, db));
	const querySnapshotScarpe = await getDocs(doQueryGender("scarpe", processedWords, gender, db));
	
	
	querySnapshotMaglie.forEach((doc) => {
		data.push(doc.data());	
	});
	querySnapshotPantaloni.forEach((doc) => {
		data.push(doc.data());
	});
	querySnapshotScarpe.forEach((doc) => {
		data.push(doc.data());
	});
	return data;

}

//in e ci sono i dati che l utente inserisce nella form
export async function fetchData(userInput) {

	const db = getFirestore(app);
	var flagProduct = -1, flagGender = -1;
	var data;
	var finale;
	finale = await getDictionary().then(async (dizionario) => {

	
		var processedWords = [];

		userInput.forEach((word) => {
			processedWords.push(correctInput(word, dizionario));
		})
		console.log("dati corretti:")
		processedWords.forEach((word) => console.log(word));


		flagProduct = await checkProduct(processedWords);
		
		console.log("flagProduct " + flagProduct);

		//caso in cui l utente non ha inserito il prodotto
		if(flagProduct === -1){

			//controllo se l utente ha inserito il genere
			

			flagGender = await checkGender(processedWords);
			
			/**
			 * caso in cui non ha inserito il genere
			 */
			if(flagGender === -1){
				console.log("no gender");
				var data;
				await getDataGenerics(processedWords, db).then((d) => data = d);
				return data;
				
			}

			//elimino il genere dall input per effettuare le query correttamente
			var genderSelected = processedWords[flagGender];
			processedWords.splice(flagGender, 1);

			data = await getDataForGender(processedWords, genderSelected, db).then((d) => data = d);
			return data;
		}
		/**
		 * caso in cui è stato inserito il prodotto
		 */
		
		
		flagGender = await checkGender(processedWords);
		
		//caso in cui non è stato inserito il genere
		if(flagGender === -1){
		
			var productSelected = processedWords[flagProduct];
			processedWords.splice(flagProduct, 1);
			console.log("productSelected " + productSelected);
			//faccio le query sul prodotto ma non sul genere
			await getDataProduct(processedWords, productSelected, db).then((d) => data = d);
			return data;
			
		}
		/**
		* caso in cui il genere è stato inserito
		*/
		
		//faccio le query sul prodotto e sul genere, tolgo prima il genere e 

		var productSelected = processedWords[flagProduct];
		var genderSelected = processedWords[flagGender];
		
		console.log("productSelected " + productSelected);
		console.log(" genderSelected " +  genderSelected);
		

		processedWords.splice(flagProduct, 1);
		processedWords.splice(flagGender - 1, 1);

		data = await getDataForProductGender(processedWords, productSelected, genderSelected, db).then((d) => data = d);
		return data;

	})
	.catch((err) => {
		console.log("errore dizionario " + err);
		return [];
	});	
	return finale;
}