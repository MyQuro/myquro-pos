export default function OrgDetail({
  data,
}: {
  data: {
    organization: any;
    owner: any;
    compliance: any;
    documents: any[];
  };
}) {
  const { organization, owner, compliance, documents } = data;

  return (
    <>
      <h1 className="text-xl font-semibold">{organization.name}</h1>

      <section>
        <h2 className="font-medium">Business</h2>
        <p>{organization.address}</p>
        <p>{organization.city}</p>
      </section>

      <section>
        <h2 className="font-medium">Owner</h2>
        <p>{owner?.ownerName}</p>
        <p>{owner?.phone}</p>
      </section>

      <section>
        <h2 className="font-medium">Compliance</h2>
        <p>FSSAI Type: {compliance?.fssaiType}</p>
        <p>FSSAI Number: {compliance?.fssaiNumber}</p>
        {compliance?.gstin && <p>GSTIN: {compliance.gstin}</p>}
      </section>

      {documents.length > 0 && (
        <section>
          <h2 className="font-medium">Documents</h2>
          <ul className="list-disc ml-5">
            {documents.map((doc) => (
              <li key={doc.id}>
                {doc.documentType} — {doc.fileName}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
