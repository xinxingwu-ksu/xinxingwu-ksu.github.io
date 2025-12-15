//const input =document.querySelector(".login__input");
const input =document.getElementById("testing");
const getbutton=document.querySelector(".login__button");
const getform=document.querySelector(".login-form");

const validateInput=(event)=>{
	const target=event.target;
	if (target.value.length>3){
		//getbutton.removeAttribute("disabled");
		getbutton.disabled = false;
	}else{
		//getbutton.setAttribute("disabled","");
		getbutton.disabled = true;
	}
	
}

const handleSubmit=(event)=>{
	event.preventDefault();
	localStorage.setItem('player', input.value);
	window.location='pages/game.html';
	
}

input.addEventListener('input',validateInput);
getform.addEventListener('submit',handleSubmit)