import { CreateAccountOutput, WalletTypes } from "locklift/types/index";
import { Address, Contract, Signer, zeroAddress } from "locklift";
import { ContractData } from "locklift/internal/factory/index";
import { FactorySource } from "../build/factorySource";
import { expect } from "chai";
import fs from "fs";
describe("should deploy the collection and Nft contracts , and return the revelant data", async function () {
  let WalletV3: CreateAccountOutput;
  var signer: Signer;
  var CollectionCon: Contract<FactorySource["RevoltNftCollection"]>;
  var RevoltNftArt: ContractData<FactorySource["RevoltNft"]>;
  var IndexArt: ContractData<FactorySource["Index"]>;
  var IndexBasisArt: ContractData<FactorySource["IndexBasis"]>;
  var collectionAddr: Address;
  before(async function () {
    signer = (await locklift.keystore.getSigner("0"))!;
    RevoltNftArt = locklift.factory.getContractArtifacts("RevoltNft");
    IndexArt = locklift.factory.getContractArtifacts("Index");
    IndexBasisArt = locklift.factory.getContractArtifacts("IndexBasis");
    WalletV3 = await locklift.factory.accounts.addNewAccount({
      type: WalletTypes.WalletV3, // or WalletTypes.HighLoadWallet or WalletTypes.WalletV3,
      //Value which will send to the new account from a giver
      value: locklift.utils.toNano(100),
      //owner publicKey
      publicKey: signer.publicKey,
    });
    console.log("wallet : ", WalletV3.account.address.toString());
  });
  let example_collection_metadata: string = fs.readFileSync(
    "./metadata/Collection_metadata.json",
    "utf-8"
  );
  it("should deploy Collection contract and return valid json", async function () {
    const { contract: Collection } = await locklift.factory.deployContract({
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
    expect(jsonReturned).to.eq(example_collection_metadata);
    // setting the state varible
    collectionAddr = Collection.address;
  });
  it("should deploy the Nft Contract and return the revelant json and data  ", async function () {
    // fetching the Collectoin contract
    const Collection = await locklift.factory.getDeployedContract(
      "RevoltNftCollection",
      collectionAddr
    );
    let example_agent_metadata: string = fs.readFileSync(
      "../metadata/agents_metadata/1.json",
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
    console.log("this is Nft Id >>", idEvent![0].id);
    const nftid = idEvent![0].id;
    const NftAddr: Address = (
      await Collection.methods.nftAddress({ answerId: 0, id: nftid }).call({})
    ).nft;
    console.log(`NftAddr : ${NftAddr.toString()}`);
    // fetching the nft contract
    const NftCon = await locklift.factory.getDeployedContract(
      "RevoltNft",
      NftAddr
    );
    expect(
      (await NftCon.methods.getInfo({ answerId: 0 }).call({})).owner.toString()
    ).to.eq(WalletV3.account.address.toString());
    expect((await NftCon.methods.getJson({ answerId: 0 }).call({})).json).to.eq(
      example_agent_metadata
    );
  });
});
