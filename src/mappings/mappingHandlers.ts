import {SubstrateExtrinsic,SubstrateEvent,SubstrateBlock} from "@subql/types";
import {XCMPalletTransfer, Account, ExternalAccountId32, ExternalAccountId20, UmpExecutedUpwardEvent, ParaInclusionCandidateBackedEvent } from "../types";

import {Balance, ParaId} from "@polkadot/types/interfaces";
import { u128 } from "@polkadot/types-codec";
import { blake2AsU8a } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';



const KusamaTreasuryAddress = "F3opxRbN5ZbjJNU511Kj2TLuzFcDq9BGduA9TgiECafpg29";


//RECEIVE KSM 
export async function handleParaInclusionCandidateBackedEvent(event: SubstrateEvent): Promise<void> {
    const [mainObj] = event.event.data.toJSON() as any;

    if (mainObj.descriptor.paraId===2023)
    {
        // let record = new ParaInclusionCandidateBackedEvent(`${event.block.block.header.number.toNumber()}-${event.idx}`);
        let record = new ParaInclusionCandidateBackedEvent(`${event.block.block.header.number.toNumber()}`);


        // record.evstring = JSON.stringify(mainObj);
        // logger.info(`\n ***** handleParaInclusionCandidateBackedEvent===> record.evstring:${record.evstring} ***** `)
    
        record.blockNum   =  event.block.block.header.number.toBigInt();
        record.blockHash  = event.block.block.header.hash.toString()
        record.timestamp  = event.block.timestamp;

        record.extrinsicHash = event.extrinsic.extrinsic.hash.toString();
        // logger.info(`\n ***** handleParaInclusionCandidateBackedEvent===> record.blockNum:${record.blockNum} record.extrinsicHash: ${record.extrinsicHash} ***** `)

        const {callIndex, args}  =   event.extrinsic.extrinsic.method.toJSON() as any;
        record.extrinsicData = JSON.stringify(args);
        // logger.info(`\n ***** handleParaInclusionCandidateBackedEvent===> record.extrinsicData:${record.extrinsicData}  ***** `)

        const backedCandidates = args.data["backedCandidates"];
        const nEv =  backedCandidates.length;
        // logger.info(`\n ***** handleParaInclusionCandidateBackedEvent===> backedCandidates.length:${nEv}  ***** `)
        for (let i=0; i<nEv; i++)
        {
            record.paraId = backedCandidates[i].candidate.descriptor.paraId;
            const paraId = backedCandidates[i].candidate.descriptor.paraId;
            // logger.info(`\n ***** handleParaInclusionCandidateBackedEvent===>   record.paraId ${record.paraId} ***** `)
           
            if (paraId===2023)
            {
                record.upwardMessageLength =  backedCandidates[i].candidate.commitments.upwardMessages.length;
                record.upwardMessage =  backedCandidates[i].candidate.commitments.upwardMessages[0];
                // logger.info(`\n ***** handleParaInclusionCandidateBackedEvent===>   record.upwardMessage ${record.upwardMessage}  ***** `)
            }

        }
        

        if (record.upwardMessageLength>0)
        {
            record.upwardMessagHash = `${u8aToHex(blake2AsU8a(record.upwardMessage))}`;
            logger.info(`\n ***** handleParaInclusionCandidateBackedEvent===>   record.upwardMessage ${record.upwardMessage} Blake2 hash of message is: record.upwardMessagHash ${record.upwardMessagHash}  ***** `)
            await record.save();
        }

    }
}



//RECEIVE KSM 
export async function handleUMPExecutedUpwardEvent(event: SubstrateEvent): Promise<void> {
    // const {event: {data: [xcmHash1 ]}} = event;
    const [upwardMessagHash] = event.event.data.toJSON() as any;

    let record = new UmpExecutedUpwardEvent(`${event.block.block.header.number.toNumber()}-${event.idx}`);
    record.blockNum   =  event.block.block.header.number.toBigInt();
    record.blockHash  = event.block.block.header.hash.toString()
    record.timestamp  = event.block.timestamp;
    record.upwardMessagHash    = upwardMessagHash;
    record.token = "KSM";   

    const nEv = event.extrinsic.events.length;

    for (let i=0; i<nEv; i++) 
    {
        // logger.info(`\n  i:${i}  event.index : ` + event.extrinsic.events[i].event.index + " method: " + event.extrinsic.events[i].event.method + " section: " + event.extrinsic.events[i].event.section);  //0x0a08
        if (  (event.extrinsic.events[i].event.section).toLowerCase() ==="ump" && (event.extrinsic.events[i].event.method).toLowerCase() ==="upwardmessagesreceived")
        {
            const [parachainId, count, size] = event.extrinsic.events[i].event.data.toJSON() as any;
            record.parachainId = parachainId;
            logger.info(`\n ***** UmpExecutedUpwardEvent  record.parachainId :${record.parachainId}`);  
        }
    }

    await record.save();
}



//SENT To  parachain  handleXCMPalletTransferCall
export async function handleXCMPalletTransferCall(extrinsic: SubstrateExtrinsic): Promise<void> {
    const extrinsicHash = extrinsic.extrinsic.hash.toString();
    const record = new XCMPalletTransfer(extrinsicHash);
    record.extrinsic_idx = extrinsic.idx;
    record.blockNum      = extrinsic.block.block.header.number.toBigInt();
    record.blockHash     = extrinsic.block.block.header.hash.toString()
    record.timestamp     = extrinsic.block.timestamp;
    record.signer        = extrinsic.extrinsic.signer.toString();      
    record.signature     = extrinsic.extrinsic.signature.toString();

    // logger.info("\n record.blockHash: ",record.blockHash);
    // logger.info("\n extrinsic.block.block.header.numbe: ",extrinsic.block.block.header.number);
    // logger.info("\n extrinsicHash: ",extrinsicHash);

    
    const {callIndex, args} =   extrinsic.extrinsic.method.toJSON() as any;
    // logger.info("\n args" + args); 
    // logger.info("\n ====> args" + JSON.stringify(args)); 

    // logger.info("\n parachain" + args.dest.v1.interior.x1.parachain); 
    const argAssets_Objkeys = Object.keys(args.assets);
    if (argAssets_Objkeys.includes("v0"))
    {
        // logger.info("\n args.assets.v0[0].concreteFungible.amount" + args.assets.v0[0].concreteFungible.amount); 
        record.transferedAmount = args.assets.v0[0].concreteFungible.amount;   
    }
    else if (argAssets_Objkeys.includes("v1"))
    {
        // logger.info("\n args.assets.v1[0].fun.fungible" + args.assets.v1[0].fun.fungible); 
        record.transferedAmount = args.assets.v1[0].fun.fungible;   
    }

    // logger.info("\n parachain" + args.weight_limit.limited); 
    // logger.info("\n parachain" + args.beneficiary.v1.interior.x1.accountKey20.key); 

    record.destinatioParachainId = args.dest.v1.interior.x1.parachain;
    record.sentFees =args.weight_limit.limited;   

    const x3AccountObj = args["beneficiary"].v1.interior.x1
    const x3AccountObj_Objkeys = Object.keys(x3AccountObj);
    // logger.info(`\n x3AccountObj_Objkeys: `,x3AccountObj_Objkeys);
    if (x3AccountObj_Objkeys.includes("accountKey20"))
    {
        const account20 = args.beneficiary.v1.interior.x1.accountKey20.key;
        // logger.info("\n DESTINATION ACCOUNT  account20 " +  account20);
        const toAccount_Id20 = await ExternalAccountId20.get(account20);
        if ( !toAccount_Id20 )
        {
            await new ExternalAccountId20( account20 ).save();
        }
        record.toAddressId20Id = account20;
    }
    
    record.transferedToken = "KSM";


    //#region
        // args{
        //     "dest":{
        //         "v1":{
        //             "parents":0,
        //             "interior":{
        //                 "x1":{
        //                     "parachain":1000}
        //                 }
        //             }
        //         },
        //     "beneficiary":{
        //         "v1":{
        //             "parents":0,
        //             "interior":{
        //                 "x1":{
        //                     "accountKey20":{
        //                         "network":{
        //                             "any":null
        //                         },
        //                         "key":"0xd60135d1d501fb45b7dd2b3761e4225cf80f96a6"
        //                     }
        //                 }
        //             }
        //         }
        //     },
        //     "assets":{
        //         "v0":[{
        //             "concreteFungible":{
        //                 "id":{
        //                     "null":null
        //                 },
        //                 "amount":112233445566
        //             }
        //         }]
        //     },
        //     "fee_asset_item":0,
        //     "weight_limit":{
        //         "limited":1000000000
        //     }
        // } 
    //#endregion


    // logger.info("\n ***** Extractng extrinsics.events Data *****")
    const nEv = extrinsic.events.length;
    // logger.info("\n  extrinsic.events.length : " + nEv); //10

    for (let i =0; i<nEv; i++)
    {
      if (  (extrinsic.events[i].event.section).toLowerCase() ==="balances" && (extrinsic.events[i].event.method).toLowerCase() ==="deposit")
      {
          const [treasuryAccount, xcmPaidfees] = extrinsic.events[i].event.data.toJSON() as any;
          if ( treasuryAccount===KusamaTreasuryAddress)
          {
            record.treasuryFees = xcmPaidfees;
            record.treasuryAddress = treasuryAccount;
            logger.info(`\n handleXCMPalletTransferCall record.treasuryAddress: ${record.treasuryAddress} record.treasuryFees: ${record.treasuryFees}`);  
          }
          else
          {
            record.validatorFees = xcmPaidfees;
            record.validatorAddress = treasuryAccount;
            logger.info(`\n handleXCMPalletTransferCall record.validatorAddress: ${record.validatorAddress} record.validatorFees: ${record.validatorFees}`);  
          }
      }
      else if (  (extrinsic.events[i].event.section).toLowerCase()==="balances"  && (extrinsic.events[i].event.method).toLowerCase() ==="transfer")
      {
          const [fromAccountI32, parachainAccountI32, grossAmount] = extrinsic.events[i].event.data.toJSON() as any;
          record.amount = grossAmount

          const fromAccount_Id32 = await Account.get(fromAccountI32);
          if ( !fromAccount_Id32 )
          {
              await new Account( fromAccountI32 ).save();
          }
          record.fromAccountId = fromAccountI32;
          
          const toAccount_I32 = await ExternalAccountId32.get(parachainAccountI32);
          if ( !toAccount_I32 )
          {
              await new ExternalAccountId32( parachainAccountI32 ).save();
          }
          record.toAddressId32Id = parachainAccountI32;
          logger.info(`\n handleXCMPalletTransferCall record.fromAccountId: ${record.fromAccountId} record.amount: ${record.amount} record.toAddressId32Id: ${record.toAddressId32Id}`);  
      }

    }

    await record.save();
}