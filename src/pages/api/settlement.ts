import { updateTopStories } from 'lib/upstash';
import { NextResponse } from 'next/server';



import {
	createThirdwebClient,
	getContract,
	sendAndConfirmTransaction,
	
	sendBatchTransaction,

	SendBatchTransactionOptions,
  
} from "thirdweb";


//import { polygonAmoy } from "thirdweb/chains";
import { polygon } from "thirdweb/chains";

import {
	privateKeyToAccount,
	smartWallet,
	getWalletBalance,
	SmartWalletOptions,
} from "thirdweb/wallets";

import {
	mintTo,
	totalSupply,
	transfer,
	
	getBalance,
  
	balanceOf,
  
} from "thirdweb/extensions/erc20";
import { ac } from '@upstash/redis/zmscore-9faf292c';




export const config = {
	runtime: 'edge',
};


const getHackerNews = async () => {
	const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
	const data = await res.json();
	return await Promise.all(data.slice(0, 3).map((item: string) => getHNItem(item)));
};

const getHNItem = async (item: string) => {
	const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${item}.json`);
	return await res.json();
};




const chain = polygon;


// USDT Token (USDT)
const tokenContractAddressUSDT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';




export default async function handler() {


	try {

		/*
		const hackerNewsData = await getHackerNews();


		
		const res = await updateTopStories(
			hackerNewsData.map((item) => ({
				id: item.id,
				by: item.by,
				url: item.url,
				time: item.time,
				title: item.title,
				score: item.score,
			}))
		);
		

		console.log({
			res,
			data: `Updated top stories at ${new Date().toISOString()}. Ids: ${hackerNewsData
				.map((item) => item.id)
				.join(', ')} `,
		});
		


		console.log({
			data: `Updated top stories at ${new Date().toISOString()}. Ids: ${hackerNewsData
				.map((item) => item.id)
				.join(', ')} `,
		});




		return NextResponse.json({
			data: `Updated top stories at ${new Date().toISOString()}. Ids: ${hackerNewsData
				.map((item) => item.id)
				.join(', ')} `,
		});
		*/



		const client = createThirdwebClient({
			secretKey: process.env.THIRDWEB_SECRET_KEY || "",
		});
		
		
		const contractUSDT = getContract({
			client,
			chain: chain,
			address: tokenContractAddressUSDT, // erc20 contract from thirdweb.com/explore
		});


		const walletPrivateKey = process.env.WALLET_PRIVATE_KEY || "";

		const personalAccount = privateKeyToAccount({
			client,
			privateKey: walletPrivateKey,
		});
	
		const wallet = smartWallet({
			chain: chain,
			factoryAddress: "0x9Bb60d360932171292Ad2b80839080fb6F5aBD97", // your own deployed account factory address
			sponsorGas: true,
		});
	
		const account = await wallet.connect({
			client: client,
			personalAccount: personalAccount,
		});
	
		const walletAddress = account.address;

	

		const balance = await getBalance({
			contract: contractUSDT,
			address: walletAddress,
		});
		  


		console.log('walletAddress', walletAddress, 'balance', balance.displayValue);



		const totalAmount = parseFloat(balance.displayValue);

		if (totalAmount > 0.0) {


			const toAddressStore = '0xAeB385c91131Efd90d60b85D143Dd0467e161a7d';

			// 99% USDT to this address
			const sendAmountToStore = parseInt(Number(totalAmount * 0.995 * 1000000.0).toFixed(0)) / 1000000.0;


			const toAddressFee = '0xcF8EE13900ECb474e8Ce89E7868C7Fd1ae930971';
			// get remaining amount
			const sendAmountToFee = parseInt(Number( (totalAmount - sendAmountToStore) * 1000000.0).toFixed(0)) / 1000000.0;


			console.log('walletAddress: ' + walletAddress + ' totalAmount: ' + totalAmount, 'sendAmountToStore: ' + sendAmountToStore, 'sendAmountToFee: ' + sendAmountToFee);



			console.log('sendAmountToStore+sendAmountToFee', sendAmountToStore+sendAmountToFee);

			/*
            const transactionSendToStore = transfer({
				contract,
				to: toAddressStore,
				amount: sendAmountToStore,
			});

			const responseStore = await sendAndConfirmTransaction({
				transaction: transactionSendToStore,
				account: account,
			});


			console.log("Sent successfully!");

			console.log(`Transaction hash: ${responseStore.transactionHash}`);
			  
			*/

			  

			const transactionSendToStore = transfer({
				contract: contractUSDT,
				to: toAddressStore,
				amount: sendAmountToStore,
			});

			const transactionSendToFee = transfer({
				contract: contractUSDT,
				to: toAddressFee,
				amount: sendAmountToFee,
			});



			// SendBatchTransactionOptions

			const batchOptions: SendBatchTransactionOptions = {
				account: account,
				transactions: [transactionSendToStore, transactionSendToFee],
			};


			const batchResponse = await sendBatchTransaction(
				batchOptions
			);
			

			//console.log('batchResponse', batchResponse);

			console.log(`Transaction hash: ${batchResponse.transactionHash}`);
			
			

		}


		

		
		return NextResponse.json({
			data: `Hello, World!`
		});


	} catch (error: any) {

		console.log({ error });
		return NextResponse.json({
			error: error.message,
		});
		
	}
}
