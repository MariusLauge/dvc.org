# import-url

Download a file or directory from a supported URL (for example `s3://`,
`ssh://`, and other protocols) into the <abbr>workspace</abbr>, and track
changes in the remote data source. Creates a DVC-file.

> See also `dvc get-url`, that corresponds to the first half of what this
> command does (downloading the <abbr>data artifact</abbr>).

## Synopsis

```usage
usage: dvc import-url [-h] [-q | -v] [-f FILE] url [out]

positional arguments:
  url                   (See supported URLs in the description.)
  out                   Destination path to put files to.
```

## Description

In some cases it's convenient to add a data file or directory from a remote
location into the workspace, such that it can be updated later, if/when the
external data source changes. Example scenarios:

- A remote system may produce occasional data files that are used in other
  projects.
- A batch process running regularly updates a data file to import.
- A shared dataset on a remote storage that is managed and updated outside DVC.

The `dvc import-url` command helps the user create such an external data
dependency. The `url` argument specifies the external location of the data to be
imported, while `out` can be used to specify the directory and/or file name
desired for the downloaded data. If an existing directory is specified, the
<abbr>output</abbr> will be created inside of it.

DVC supports [DVC-files](/doc/user-guide/dvc-file-format) that refer to data in
external locations, see
[External Dependencies](/doc/user-guide/external-dependencies). In such a
DVC-file, the `deps` section stores the remote URL, and the `outs` section
contains the corresponding local path in the workspace. It records metadata from
the external file or directory, allowing DVC to efficiently check it later and
determine whether the local copy is out of date.

DVC supports several types of (local or) remote locations (protocols):

| Type     | Description                                         | `url` format                               |
| -------- | --------------------------------------------------- | ------------------------------------------ |
| `local`  | Local path                                          | `/path/to/local/data`                      |
| `s3`     | Amazon S3                                           | `s3://mybucket/data`                       |
| `gs`     | Google Storage                                      | `gs://mybucket/data`                       |
| `ssh`    | SSH server                                          | `ssh://user@example.com:/path/to/data`     |
| `hdfs`   | HDFS to file (explanation below)                    | `hdfs://user@example.com/path/to/data.csv` |
| `http`   | HTTP to file with _strong ETag_ (explanation below) | `https://example.com/path/to/data.csv`     |
| `remote` | Remote path (see explanation below)                 | `remote://myremote/path/to/data`           |

> If you installed DVC via `pip` and plan to use cloud services as remote
> storage, you might need to install these optional dependencies: `[s3]`,
> `[azure]`, `[gdrive]`, `[gs]`, `[oss]`, `[ssh]`. Alternatively, use `[all]` to
> include them all. The command should look like this: `pip install "dvc[s3]"`.
> (This example installs `boto3` library along with DVC to support S3 storage.)

Specific explanations:

- HDFS and HTTP **do not** support downloading entire directories, only single
  files.

- In case of HTTP,
  [strong ETag](https://en.wikipedia.org/wiki/HTTP_ETag#Strong_and_weak_validation)
  is necessary to track if the specified remote file (URL) changed to download
  it again.

- `remote://myremote/path/to/file` notation just means that a DVC
  [remote](/doc/command-reference/remote) `myremote` is defined and when DVC is
  running. DVC automatically expands this URL into a regular S3, SSH, GS, etc
  URL by appending `/path/to/file` to the `myremote`'s configured base path.

Another way to understand the `dvc import-url` command is as a short-cut for a
more verbose `dvc run` command. This is discussed in the
[External Dependencies](/doc/user-guide/external-dependencies) documentation,
where an alternative is demonstrated for each of these schemes.

Instead of:

```dvc
$ dvc import-url https://example.com/path/to/data.csv data.csv
```

It is possible to instead use `dvc run`, for example (HTTP URL):

```dvc
$ dvc run -d https://example.com/path/to/data.csv \
          -o data.csv \
          wget https://example.com/path/to/data.csv -O data.csv
```

Both methods generate an equivalent [stage file](/doc/command-reference/run)
(DVC-file) with an external dependency. The `dvc import-url` command saves the
user from having to manually copy files from each of the remote storage schemes,
and from having to install CLI tools for each service.

Note that import stages are considered always locked, meaning that if you run
`dvc repro`, they won't be updated. Use `dvc update` on them to bring the import
up to date from the external data source.

> See `dvc import` to download and tack data/model files or directories from
> other <abbr>DVC repositories</abbr> (e.g. GitHub URLs).

## Options

- `-f`, `--file` - specify a path and/or file name for the DVC-file created by
  this command (e.g. `-f stages/stage.dvc`). This overrides the default file
  name: `<file>.dvc`, where `<file>` is the file name of the output (`out`).

- `-h`, `--help` - prints the usage/help message, and exit.

- `-q`, `--quiet` - do not write anything to standard output. Exit with 0 if no
  problems arise, otherwise 1.

- `-v`, `--verbose` - displays detailed tracing information.

## Examples

To illustrate these examples we will be using the <abbr>project</abbr> explained
in the [Get Started](/doc/get-started) section.

<details>

### Click and expand to setup example

Start by cloning our example repo if you don't already have it. Then move into
the repo and checkout the
[2-remote](https://github.com/iterative/example-get-started/releases/tag/2-remote)
tag, corresponding to the [Configure](/doc/get-started/configure) _Get Started_
chapter:

```dvc
$ git clone https://github.com/iterative/example-get-started
$ cd example-get-started
$ git checkout 2-remote
$ mkdir data
```

You should now have a blank workspace, just before the
[Add Files](/doc/get-started/add-files) chapter.

</details>

## Example: Tracking a remote file

An advanced alternate to [Add Files](/doc/get-started/add-files) chapter of the
_Get Started_ section is to use `dvc import-url`:

```dvc
$ dvc import-url https://data.dvc.org/get-started/data.xml \
                 data/data.xml
Importing 'https://data.dvc.org/get-started/data.xml' -> 'data/data.xml'
...
To track the changes with git, run:

	git add data.xml.dvc data/.gitignore
```

Let's take a look at the resulting stage file (DVC-file) `data.xml.dvc`:

```yaml
md5: 61e80c38c1ce04ed2e11e331258e6d0d
wdir: .
deps:
  - etag: '"f432e270cd634c51296ecd2bc2f5e752-5"'
    path: https://data.dvc.org/get-started/data.xml
outs:
  - md5: a304afb96060aad90176268345e10355
    path: data/data.xml
    cache: true
    metric: false
    persist: false
```

The `etag` field in the DVC-file contains the
[ETag](https://en.wikipedia.org/wiki/HTTP_ETag) recorded from the HTTP request.
If the remote file changes, its ETag will be different. This metadata allows DVC
to determine whether its necessary to download it again.

> See [DVC-File Format](/doc/user-guide/dvc-file-format) for more details on the
> text format above.

You may want to get out of and remove the `example-get-started/` directory after
trying this example (especially if trying out the following one).

## Example: Detecting remote file changes

What if that remote file is updated regularly? The project goals might include
regenerating a <abbr>data artifact</abbr> based on the updated data source.
[Pipeline](/doc/command-reference/pipeline) reproduction can be triggered based
on a changed external dependency.

Let's use the [Get Started](/doc/get-started) project again, simulating an
updated external data source. (Remember to prepare the <abbr>workspace</abbr>,
as explained in [Examples](#examples))

To illustrate this scenario, let's use a local file system directory (external
to the workspace) to simulate a remote data source location. (In real life, the
data file will probably be on a remote server.) Run these commands:

```dvc
$ mkdir /tmp/dvc-import-url-example
$ cd /tmp/dvc-import-url-example/
$ wget https://data.dvc.org/get-started/data.xml
$ cd -  # to go back to the project
```

In a production system, you might have a process to update data files. That's
not what we have here, so in this case we'll set up a "data store" where we can
edit the data file.

```dvc
$ dvc import-url /tmp/dvc-import-url-example/data.xml data/data.xml
Importing '../../../tmp/dvc-import-url-example/data.xml' -> 'data/data.xml'
```

Check `data.xml.dvc`:

```yaml
md5: eca0a296d67781cc488c6ffd1cc63b8e
wdir: .
deps:
  - md5: a304afb96060aad90176268345e10355
    path: /tmp/dvc-import-url-example/data.xml
outs:
  - md5: a304afb96060aad90176268345e10355
    path: data/data.xml
    cache: true
    metric: false
    persist: false
```

The DVC-file is nearly the same as in the previous example. The difference is
that the dependency (`deps`) now references the local file in the data store
directory we created previously. (Its `path` has the URL for the data store.)
And instead of an `etag` we have an `md5` hash value. We did this so its easy to
edit the data file.

Let's now manually reproduce a
[processing chapter](/doc/get-started/connect-code-and-data) from the _Get
Started_ project. Download the example source code archive and unzip it:

```dvc
$ wget https://code.dvc.org/get-started/code.zip
$ unzip code.zip
$ rm -f code.zip
```

<details>

### Click and expand to setup the environment

Let's install the requirements. But before we do that, we **strongly** recommend
creating a
[virtual environment](https://packaging.python.org/tutorials/installing-packages/#creating-virtual-environments):

```dvc
$ virtualenv -p python3 .env
$ source .env/bin/activate
$ pip install -r src/requirements.txt
```

</details>

```dvc
$ dvc run -f prepare.dvc \
          -d src/prepare.py -d data/data.xml \
          -o data/prepared \
          python src/prepare.py data/data.xml
Running command:
	python src/prepare.py data/data.xml
...
$ tree
.
├── data
│   ├── data.xml
│   └── prepared
│       ├── test.tsv
│       └── train.tsv
├── data.xml.dvc
├── prepare.dvc
├── requirements.txt
└── src
    ├── evaluate.py
    ├── featurization.py
    ├── prepare.py
    └── train.py

3 directories, 10 files
```

At this point, DVC considers everything being up to date:

```dvc
$ dvc status
Data and pipelines are up to date.
```

In the data store directory, edit `data.xml`. It doesn't matter what you change,
as long as it remains a valid XML file, because any change will result in a
different dependency file hash (`md5`) in the import stage DVC-file. Once we do
so, we can run `dvc update` to make sure the import stage is up to date:

```dvc
$ dvc update data.xml.dvc
...
Importing '.../tmp/dvc-import-url-example/data.xml' -> 'data/data.xml'
```

DVC has noticed the "external" data source has changed, and updated the import
stage (reproduced it). In this case it's also necessary to run `dvc repro` so
that the rest of the pipeline results are also regenerated. We can confirm so
with:

```dvc
$ dvc status
prepare.dvc:
	changed deps:
		modified:           data/data.xml
```

Since we know the "prepare" stage is all that's left, let's just reproduce that
stage specifically:

```dvc
$ dvc repro prepare.dvc
...
Reproducing 'prepare.dvc'
...
$ dvc status
Data and pipelines are up to date.
```

`dvc repro` executes the command defined in the given `prepare.dvc` stage after
noticing that its dependency `data/data.xml` has changed. `dvc status` should
report "Data and pipelines are up to date." after this.
