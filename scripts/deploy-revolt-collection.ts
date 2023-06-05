import { WalletTypes } from "locklift/types/index";
import { Address, Contract, Signer, zeroAddress } from "locklift";
import { FactorySource } from "../build/factorySource";
import fs from "fs";
import * as ever from "everscale-standalone-client";
async function main() {
  const signer = (await locklift.keystore.getSigner("1"))!;
  var RevoltNftArt = locklift.factory.getContractArtifacts("RevoltNft");
  const IndexArt = locklift.factory.getContractArtifacts("Index");
  const IndexBasisArt = locklift.factory.getContractArtifacts("IndexBasis");
  var CollectionCon: Contract<FactorySource["RevoltNftCollection"]>;
  const everWallet = ever.EverWalletAccount.fromPubkey({
    publicKey: signer.publicKey,
    workchain: 0,
  });
  RevoltNftArt = locklift.factory.getContractArtifacts("RevoltNft");

  console.log("wallet : ", (await everWallet).address.toString());
  let example_collection_metadata: string = fs.readFileSync(
    "./metadata/Collection_metadata.json",
    "utf-8"
  );
  const { contract: Collection, tx } = await locklift.factory.deployContract({
    contract: "RevoltNftCollection",
    publicKey: signer.publicKey,
    initParams: { _version: 2 },
    constructorParams: {
      codeIndex: IndexArt.code,
      codeIndexBasis: IndexBasisArt.code,
      codeNft: RevoltNftArt.code,
      json: example_collection_metadata,
    },
    value: locklift.utils.toNano(0.2),
  });
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
