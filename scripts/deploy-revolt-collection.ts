import { WalletTypes } from "locklift/types/index";
import { Address, Contract, Signer, zeroAddress } from "locklift";
import { FactorySource } from "../build/factorySource";
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
  const metadata = {
    type: "Basic NFT",
    name: "Revolt NFT",
    description: "bad ass nft collection",
    preview: {
      source:
        "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGljfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
      mimetype: "image/png",
    },
    files: [
      {
        source:
          "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGljfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
        mimetype: "image/png",
      },
    ],
    external_url: "https://nft.venom",
  };
  const { contract: Collection, tx } = await locklift.factory.deployContract({
    contract: "RevoltNftCollection",
    publicKey: signer.publicKey,
    initParams: {},
    constructorParams: {
      codeIndex: IndexArt.code,
      codeIndexBasis: IndexBasisArt.code,
      codeNft: RevoltNftArt.code,
      json: JSON.stringify(metadata),
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
  console.log(`this is the json \n ${jsonReturned} \n `);
  const { traceTree: data } = await locklift.tracing.trace(
    Collection.methods.mint({}).send({
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
  console.log(
    "nft owner  :",
    (await NftCon.methods.getInfo({ answerId: 0 }).call({})).owner.toString()
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
