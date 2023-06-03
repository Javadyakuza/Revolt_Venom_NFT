import { WalletTypes } from "locklift/types/index";
import { Address, Contract, Signer, zeroAddress } from "locklift";
import { FactorySource } from "../build/factorySource";
import fs from "fs";

async function main() {
  const signer = (await locklift.keystore.getSigner("0"))!;
  const RevoltNftArt = locklift.factory.getContractArtifacts("RevoltNft");
  const IndexArt = locklift.factory.getContractArtifacts("Index");
  const IndexBasisArt = locklift.factory.getContractArtifacts("IndexBasis");
  var CollectionCon: Contract<FactorySource["RevoltNftCollection"]>;
  const WalletV3 = await locklift.factory.accounts.addNewAccount({
    type: WalletTypes.WalletV3, // or WalletTypes.HighLoadWallet or WalletTypes.WalletV3,
    //Value which will send to the new account from a giver
    value: locklift.utils.toNano(100),
    //owner publicKey
    publicKey: signer.publicKey,
  });
  console.log("wallet : ", WalletV3.account.address.toString());
  let example_collection_metadata: string = fs.readFileSync(
    "./metadata/Collection_metadata.json",
    "utf-8"
  );
  const { contract: Collection, tx } = await locklift.factory.deployContract({
    contract: "RevoltNftCollection",
    publicKey: signer.publicKey,
    initParams: {},
    constructorParams: {
      codeIndex: IndexArt.code,
      codeIndexBasis: IndexBasisArt.code,
      codeNft: RevoltNftArt.code,
      json: example_collection_metadata,
    },
    value: locklift.utils.toNano(3),
  });
  CollectionCon = Collection;
  console.log(`collection : ${Collection.address.toString()}`);
  const jsonReturned = (
    await Collection.methods
      .getJson({
        answerId: 0,
      })
      .call({})
  ).json;
  console.log(`Colection json : \n ${jsonReturned} \n `);
  let example_agent_metadata: string = fs.readFileSync(
    "./metadata/agents_metadata/1.json",
    "utf-8"
  );
  const { traceTree: data } = await locklift.tracing.trace(
    Collection.methods.mint({ _json: example_agent_metadata }).send({
      from: WalletV3.account.address,
      amount: locklift.utils.toNano(5),
    })
  );
  const idEvent = data?.findEventsForContract({
    contract: CollectionCon,
    name: "NftCreated" as const,
  });
  console.log("Nft Id : ", idEvent![0].id);
  const nftid = idEvent![0].id;
  const NftAddr: Address = (
    await Collection.methods.nftAddress({ answerId: 0, id: nftid }).call({})
  ).nft;
  console.log(`Nft address :: ${NftAddr.toString()}`);
  // fetching the nft contract
  const NftCon = await locklift.factory.getDeployedContract(
    "RevoltNft",
    NftAddr
  );
  console.log(
    "nft owner  :",
    (await NftCon.methods.getInfo({ answerId: 0 }).call({})).owner.toString()
  );
  console.log(
    "nft json :",
    (await NftCon.methods.getJson({ answerId: 0 }).call({})).json.toString()
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
