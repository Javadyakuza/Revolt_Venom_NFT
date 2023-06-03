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
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
