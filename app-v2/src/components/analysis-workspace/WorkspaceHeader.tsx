export function WorkspaceHeader() {
  return (
    <>
      <a className="skip-link" href="#analysis-workspace">
        Skip to analysis workspace
      </a>

      <header className="workspace-header">
        <div className="workspace-brand">
          <p className="workspace-eyebrow">2021 federal election explorer</p>
          <h1>Build Your Bundestag</h1>
        </div>

        <p className="workspace-introduction">
          Adjust an electorate scenario and compare its parliament, party result,
          and possible majorities in one workspace.
        </p>

        <a className="methodology-link" href="#methodology">
          Methodology &amp; data
        </a>
      </header>
    </>
  )
}
