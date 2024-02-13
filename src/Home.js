import React, { useRef, useEffect } from 'react';
import './Style/StyleHeader.css';
import './Style/StyleProducts.css';
import { MyHeader } from './Myheader';
import { catalogo } from './TempDataProduct'; 

function ProductPreview({product, image}) {
	return (
		<div className="product-preview">
			<img className='imageProduct' src={image}/>
    	</div>
	);
}

export function Home() {

	const pantaloniUomo = catalogo.uomo.pantaloni;
	const scrollContainer = useRef(null);//per evitare il re-rendering e poter effettuare lo scroll della lista

	const scroll = (scrollOffset) => {//funzione usata per navigare la lista

		if (scrollContainer.current) {//se il componente 
			scrollContainer.current.scrollBy({ top: 0, left: scrollOffset, behavior: 'smooth' });
		}
	};

	useEffect(() => {

		const handleWheel = (e) => {
			if (e.deltaY) {
				e.preventDefault();
				scrollContainer.current.scrollLeft += e.deltaY;
			}
		};

		if (scrollContainer.current) {
			scrollContainer.current.addEventListener('wheel', handleWheel);
		}

		return () => {
			if (scrollContainer.current) {
				scrollContainer.current.removeEventListener('wheel', handleWheel);
			}
		};
	}, []);

	return (
		<div id="Home_id">

			<MyHeader/>	
		 
			<main className='mainclassnm'>

				<div className="product-list" ref={scrollContainer}>
					{pantaloniUomo.map((product, index) => {
						var path = process.env.PUBLIC_URL + "/" + product.url;
						return <ProductPreview key={index} product={product} image={path} />
					})}
				</div>
				
			</main>
			<footer>
	
			</footer>
		</div>
	);
}
