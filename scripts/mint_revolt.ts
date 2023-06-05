import { WalletTypes } from "locklift/types/index";
import { Address, Contract, Signer, zeroAddress } from "locklift";
import { FactorySource } from "../build/factorySource";
import fs from "fs";
import * as ever from "everscale-standalone-client";
import { deployedContracts } from "./constants";
async function main() {
  const signer = (await locklift.keystore.getSigner("1"))!;
  const RevoltNftArt = locklift.factory.getContractArtifacts("RevoltNft");
  const IndexArt = locklift.factory.getContractArtifacts("Index");
  const IndexBasisArt = locklift.factory.getContractArtifacts("IndexBasis");
  var CollectionCon: Contract<FactorySource["RevoltNftCollection"]>;
  const everWallet = ever.EverWalletAccount.fromPubkey({
    publicKey: signer.publicKey,
    workchain: 0,
  });
  console.log("wallet : ", (await everWallet).address.toString());

  let example_agent_metadata: string = fs.readFileSync(
    "./metadata/agents_metadata/2.json",
    "utf-8"
  );
  const Collection = await locklift.factory.getDeployedContract(
    "RevoltNftCollection",
    new Address(deployedContracts.RevoltCollection)
  );
  const { traceTree: data } = await locklift.tracing.trace(
    Collection.methods.mint({ _json: example_agent_metadata }).send({
      from: (await everWallet).address,
      amount: locklift.utils.toNano(1),
    })
  );
  const idEvent = data?.findEventsForContract({
    contract: Collection,
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
